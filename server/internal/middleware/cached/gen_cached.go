// +build ignore

package main

import (
	"text/template"

	"src.sourcegraph.com/sourcegraph/gen"
)

func main() {
	svcs := []string{
		"../../../../Godeps/_workspace/src/src.sourcegraph.com/sourcegraph/go-sourcegraph/sourcegraph/sourcegraph.pb.go",
		"../../../../Godeps/_workspace/src/sourcegraph.com/sourcegraph/srclib/store/pb/srcstore.pb.go",
		"../../../../gitserver/gitpb/git_transport.pb.go",
	}
	gen.Generate("cached.go", tmpl, svcs, isCached)
}

func isCached(x *gen.Service) bool {
	return x.Name != "MultiRepoImporter" && x.Name != "GitTransport"
}

var tmpl = template.Must(template.New("").Delims("<<<", ">>>").Parse(`// GENERATED CODE - DO NOT EDIT!
//
// Generated by:
//
//   go run gen_cached.go
//
// Called via:
//
//   go generate
//

package cached

import (
	"src.sourcegraph.com/sourcegraph/go-sourcegraph/sourcegraph"
	"src.sourcegraph.com/sourcegraph/svc"
)

// Wrap wraps services with an implementation of each service that sets grpccache trailers after each method returns.
func Wrap(s svc.Services) svc.Services {
	<<<range .>>>
	  if s.<<<.Name>>> != nil {
			s.<<<.Name>>> = &sourcegraph.Cached<<<.Name>>>Server{s.<<<.Name>>>}
		}
	<<<end>>>
	return s
}`))
