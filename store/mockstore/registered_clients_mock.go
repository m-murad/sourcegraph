// generated by gen-mocks; DO NOT EDIT

package mockstore

import (
	"golang.org/x/net/context"
	"src.sourcegraph.com/sourcegraph/go-sourcegraph/sourcegraph"
	"src.sourcegraph.com/sourcegraph/store"
)

type RegisteredClients struct {
	Get_              func(v0 context.Context, v1 sourcegraph.RegisteredClientSpec) (*sourcegraph.RegisteredClient, error)
	GetByCredentials_ func(v0 context.Context, v1 sourcegraph.RegisteredClientCredentials) (*sourcegraph.RegisteredClient, error)
	Create_           func(v0 context.Context, v1 sourcegraph.RegisteredClient) error
	Update_           func(v0 context.Context, v1 sourcegraph.RegisteredClient) error
	Delete_           func(v0 context.Context, v1 sourcegraph.RegisteredClientSpec) error
	List_             func(v0 context.Context, v1 sourcegraph.RegisteredClientListOptions) (*sourcegraph.RegisteredClientList, error)
}

func (s *RegisteredClients) Get(v0 context.Context, v1 sourcegraph.RegisteredClientSpec) (*sourcegraph.RegisteredClient, error) {
	return s.Get_(v0, v1)
}

func (s *RegisteredClients) GetByCredentials(v0 context.Context, v1 sourcegraph.RegisteredClientCredentials) (*sourcegraph.RegisteredClient, error) {
	return s.GetByCredentials_(v0, v1)
}

func (s *RegisteredClients) Create(v0 context.Context, v1 sourcegraph.RegisteredClient) error {
	return s.Create_(v0, v1)
}

func (s *RegisteredClients) Update(v0 context.Context, v1 sourcegraph.RegisteredClient) error {
	return s.Update_(v0, v1)
}

func (s *RegisteredClients) Delete(v0 context.Context, v1 sourcegraph.RegisteredClientSpec) error {
	return s.Delete_(v0, v1)
}

func (s *RegisteredClients) List(v0 context.Context, v1 sourcegraph.RegisteredClientListOptions) (*sourcegraph.RegisteredClientList, error) {
	return s.List_(v0, v1)
}

var _ store.RegisteredClients = (*RegisteredClients)(nil)

type UserPermissions struct {
	Get_    func(ctx context.Context, opt *sourcegraph.UserPermissionsOptions) (*sourcegraph.UserPermissions, error)
	Verify_ func(ctx context.Context, perms *sourcegraph.UserPermissions) (bool, error)
	Set_    func(ctx context.Context, perms *sourcegraph.UserPermissions) error
	List_   func(ctx context.Context, client *sourcegraph.RegisteredClientSpec) (*sourcegraph.UserPermissionsList, error)
}

func (s *UserPermissions) Get(ctx context.Context, opt *sourcegraph.UserPermissionsOptions) (*sourcegraph.UserPermissions, error) {
	return s.Get_(ctx, opt)
}

func (s *UserPermissions) Verify(ctx context.Context, perms *sourcegraph.UserPermissions) (bool, error) {
	return s.Verify_(ctx, perms)
}

func (s *UserPermissions) Set(ctx context.Context, perms *sourcegraph.UserPermissions) error {
	return s.Set_(ctx, perms)
}

func (s *UserPermissions) List(ctx context.Context, client *sourcegraph.RegisteredClientSpec) (*sourcegraph.UserPermissionsList, error) {
	return s.List_(ctx, client)
}

var _ store.UserPermissions = (*UserPermissions)(nil)
