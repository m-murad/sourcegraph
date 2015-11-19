// generated by gen-mocks; DO NOT EDIT

package mockstore

import (
	"golang.org/x/net/context"
	"src.sourcegraph.com/sourcegraph/go-sourcegraph/sourcegraph"
	"src.sourcegraph.com/sourcegraph/store"
)

type Changesets struct {
	Create_       func(ctx context.Context, repo string, cs *sourcegraph.Changeset) error
	Get_          func(ctx context.Context, repo string, ID int64) (*sourcegraph.Changeset, error)
	List_         func(ctx context.Context, op *sourcegraph.ChangesetListOp) (*sourcegraph.ChangesetList, error)
	CreateReview_ func(ctx context.Context, repo string, changesetID int64, newReview *sourcegraph.ChangesetReview) (*sourcegraph.ChangesetReview, error)
	ListReviews_  func(ctx context.Context, repo string, changesetID int64) (*sourcegraph.ChangesetReviewList, error)
	Update_       func(ctx context.Context, op *store.ChangesetUpdateOp) (*sourcegraph.ChangesetEvent, error)
	Merge_        func(ctx context.Context, op *sourcegraph.ChangesetMergeOp) error
	ListEvents_   func(ctx context.Context, spec *sourcegraph.ChangesetSpec) (*sourcegraph.ChangesetEventList, error)
}

func (s *Changesets) Create(ctx context.Context, repo string, cs *sourcegraph.Changeset) error {
	return s.Create_(ctx, repo, cs)
}

func (s *Changesets) Get(ctx context.Context, repo string, ID int64) (*sourcegraph.Changeset, error) {
	return s.Get_(ctx, repo, ID)
}

func (s *Changesets) List(ctx context.Context, op *sourcegraph.ChangesetListOp) (*sourcegraph.ChangesetList, error) {
	return s.List_(ctx, op)
}

func (s *Changesets) CreateReview(ctx context.Context, repo string, changesetID int64, newReview *sourcegraph.ChangesetReview) (*sourcegraph.ChangesetReview, error) {
	return s.CreateReview_(ctx, repo, changesetID, newReview)
}

func (s *Changesets) ListReviews(ctx context.Context, repo string, changesetID int64) (*sourcegraph.ChangesetReviewList, error) {
	return s.ListReviews_(ctx, repo, changesetID)
}

func (s *Changesets) Update(ctx context.Context, op *store.ChangesetUpdateOp) (*sourcegraph.ChangesetEvent, error) {
	return s.Update_(ctx, op)
}

func (s *Changesets) Merge(ctx context.Context, op *sourcegraph.ChangesetMergeOp) error {
	return s.Merge_(ctx, op)
}

func (s *Changesets) ListEvents(ctx context.Context, spec *sourcegraph.ChangesetSpec) (*sourcegraph.ChangesetEventList, error) {
	return s.ListEvents_(ctx, spec)
}

var _ store.Changesets = (*Changesets)(nil)
