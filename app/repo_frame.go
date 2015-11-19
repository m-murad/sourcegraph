package app

import (
	"errors"
	"fmt"
	"html/template"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"

	gcontext "github.com/gorilla/context"
	"github.com/sourcegraph/mux"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"src.sourcegraph.com/sourcegraph/go-sourcegraph/sourcegraph"
	"src.sourcegraph.com/sourcegraph/app/appconf"
	"src.sourcegraph.com/sourcegraph/app/internal/tmpl"
	"src.sourcegraph.com/sourcegraph/errcode"
	"src.sourcegraph.com/sourcegraph/platform"
	"src.sourcegraph.com/sourcegraph/platform/pctx"
	"src.sourcegraph.com/sourcegraph/util/handlerutil"
	"src.sourcegraph.com/sourcegraph/util/httputil/httpctx"
)

// orderedRepoEnabledFrames returns apps that are enabled for the given repo. Key of frames map is the app ID.
// It also returns a slice of app IDs that defines the order in which they should be displayed.
func orderedRepoEnabledFrames(repo *sourcegraph.Repo) (frames map[string]platform.RepoFrame, orderedIDs []string) {
	if appconf.Flags.DisableApps {
		return nil, nil
	}

	// If the repo's canonical location is on another server, disallow all apps for now.
	// TODO: There may still be some apps that can be enabled for non-canonical repos, provide a way for that to happen.
	if repo.Mirror {
		return nil, nil
	}

	// Non-git apps are not currently supported
	if repo.VCS != "git" {
		return nil, nil
	}

	frames = make(map[string]platform.RepoFrame)
	for _, frame := range platform.Frames() {
		if frame.Enable == nil || frame.Enable(repo) {
			frames[frame.ID] = frame
			orderedIDs = append(orderedIDs, frame.ID)
		}
	}

	// Make tracker the first app and changes the second for now.
	// TODO: This should eventually be configurable.
	for i, appID := range orderedIDs {
		switch appID {
		case "tracker":
			orderedIDs[0], orderedIDs[i] = orderedIDs[i], orderedIDs[0]
		case "changes":
			orderedIDs[1], orderedIDs[i] = orderedIDs[i], orderedIDs[1]
		}
	}

	return frames, orderedIDs
}

func serveRepoFrame(w http.ResponseWriter, r *http.Request) error {
	rc, vc, err := handlerutil.GetRepoAndRevCommon(r, nil)
	if err != nil {
		return err
	}

	appID := mux.Vars(r)["App"]
	frames, _ := orderedRepoEnabledFrames(rc.Repo)
	app, ok := frames[appID]
	if !ok {
		return &errcode.HTTPErr{Status: http.StatusNotFound, Err: errors.New("not a valid app")}
	}

	if vc.RepoCommit == nil {
		return renderRepoNoVCSDataTemplate(w, r, rc)
	}

	bc, err := handlerutil.GetRepoBuildCommon(r, rc, vc, nil)
	if err != nil {
		return err
	}
	vc.RepoRevSpec = bc.BestRevSpec

	// TODO(beyang): think of more robust way of isolating apps to
	// prevent shared mutable state (e.g., modifying http.Requests) to
	// prevent inter-app interference
	rCopy := *r
	urlCopy := *r.URL
	rCopy.URL = &urlCopy

	ctx := httpctx.FromRequest(r)

	framectx, err := pctx.WithRepoFrameInfo(ctx, r)
	if err != nil {
		return err
	}
	httpctx.SetForRequest(&rCopy, framectx)
	defer gcontext.Clear(&rCopy) // clear the app context after finished to avoid a memory leak

	rr := httptest.NewRecorder()

	stripPrefix := pctx.BaseURI(framectx)
	if u, err := url.Parse(stripPrefix); err == nil {
		stripPrefix = u.Path
	} else {
		return err
	}

	// The canonical URL for app root page does not have a trailing slash, so redirect.
	if rCopy.URL.Path == stripPrefix+"/" {
		baseURL := stripPrefix
		if rCopy.URL.RawQuery != "" {
			baseURL += "?" + rCopy.URL.RawQuery
		}
		http.Redirect(w, r, baseURL, http.StatusMovedPermanently)
		return nil
	}

	// strip prefix
	if p := strings.TrimPrefix(rCopy.URL.Path, stripPrefix); len(p) < len(r.URL.Path) {
		rCopy.URL.Path = p
		if rCopy.URL.Path == "" { // For the app http.Handler, the root path should always be "/".
			rCopy.URL.Path = "/"
		}
	} else {
		return fmt.Errorf("could not load app: %q was not a prefix of %q", stripPrefix, rCopy.URL.Path)
	}
	app.Handler.ServeHTTP(rr, &rCopy)

	// extract response body (purposefully ignoring headers)
	body := string(rr.Body.Bytes())

	// If Sourcegraph-Verbatim header was set to true, relay this
	// request to browser directly, and copy appropriate headers.
	if rr.Header().Get(platform.HTTPHeaderVerbatim) == "true" {
		w.Header().Set("Content-Encoding", rr.Header().Get("Content-Encoding"))
		w.Header().Set("Content-Type", rr.Header().Get("Content-Type"))
		w.Header().Set("Location", rr.Header().Get("Location"))
		w.WriteHeader(rr.Code)
		_, err := io.Copy(w, rr.Body)
		return err
	}

	var appHTML template.HTML
	var appError error
	if rr.Code == http.StatusOK {
		appHTML = template.HTML(body)
	} else if rr.Code == http.StatusUnauthorized && nil == handlerutil.UserFromContext(ctx) {
		// App returned Unauthorized, and user's not logged in. So redirect to login page and try again.
		return grpc.Errorf(codes.Unauthenticated, "platform app returned unauthorized and no authenticated user in current context")
	} else {
		appError = errors.New(body)
	}
	appSubtitle := rr.Header().Get(platform.HTTPHeaderTitle)

	return tmpl.Exec(r, w, "repo/frame.html", http.StatusOK, nil, &struct {
		handlerutil.RepoCommon
		handlerutil.RepoRevCommon
		handlerutil.RepoBuildCommon

		RepoIsBuilt bool

		AppSubtitle string
		AppTitle    string
		AppHTML     template.HTML
		AppError    error

		RobotsIndex bool
		tmpl.Common
	}{
		RepoCommon:      *rc,
		RepoRevCommon:   *vc,
		RepoBuildCommon: bc,

		RepoIsBuilt: bc.RepoBuildInfo != nil && bc.RepoBuildInfo.LastSuccessful != nil,

		AppSubtitle: appSubtitle,
		AppTitle:    app.Title,
		AppHTML:     appHTML,
		AppError:    appError,

		RobotsIndex: true,
	})
}
