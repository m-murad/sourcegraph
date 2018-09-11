import LoaderIcon from '@sourcegraph/icons/lib/Loader'
import PuzzleIcon from '@sourcegraph/icons/lib/Puzzle'
import { upperFirst } from 'lodash'
import AddIcon from 'mdi-react/AddIcon'
import * as React from 'react'
import { Redirect, RouteComponentProps } from 'react-router'
import { concat, Observable, Subject, Subscription } from 'rxjs'
import { catchError, concatMap, map, mapTo, switchMap, tap } from 'rxjs/operators'
import { gql, mutateGraphQL } from '../../backend/graphql'
import * as GQL from '../../backend/graphqlschema'
import { Form } from '../../components/Form'
import { ModalPage } from '../../components/ModalPage'
import { PageTitle } from '../../components/PageTitle'
import { eventLogger } from '../../tracking/eventLogger'
import { asError, createAggregateError, ErrorLike, isErrorLike } from '../../util/errors'
import { RegistryPublisher, toExtensionID } from '../extension/extension'
import { updateUserExtensionSettings } from '../ExtensionsClientCommonContext'
import { queryViewerRegistryPublishers } from './backend'
import { RegistryAreaPageProps } from './RegistryArea'
import { RegistryExtensionNameFormGroup, RegistryPublisherFormGroup } from './RegistryExtensionForm'

function createExtension(publisher: GQL.ID, name: string): Observable<GQL.IExtensionRegistryCreateExtensionResult> {
    return mutateGraphQL(
        gql`
            mutation CreateRegistryExtension($publisher: ID!, $name: String!) {
                extensionRegistry {
                    createExtension(publisher: $publisher, name: $name) {
                        extension {
                            id
                            extensionID
                            url
                        }
                    }
                }
            }
        `,
        { publisher, name }
    ).pipe(
        map(({ data, errors }) => {
            if (
                !data ||
                !data.extensionRegistry ||
                !data.extensionRegistry.createExtension ||
                (errors && errors.length > 0)
            ) {
                throw createAggregateError(errors)
            }
            return data.extensionRegistry.createExtension
        })
    )
}

/**
 * It is convenient and less confusing for users if newly created extensions are added to their user settings. That
 * means that they are immediately usable.
 */
function configureNewExtensionAsDisabled(extensionID: string): Observable<void> {
    return updateUserExtensionSettings({ extensionID, enabled: true }) as Observable<any>
}

interface Props extends RegistryAreaPageProps, RouteComponentProps<{}> {}

interface State {
    /** The viewer's authorized publishers, undefined while loading, or an error. */
    publishersOrError: 'loading' | RegistryPublisher[] | ErrorLike

    name: string
    publisher?: GQL.ID

    /** The creation result, undefined while loading, or an error. */
    creationOrError?: 'loading' | GQL.IExtensionRegistryCreateExtensionResult | ErrorLike
}

/** A page with a form to create a new extension in the extension registry. */
export class RegistryNewExtensionPage extends React.PureComponent<Props, State> {
    public state: State = {
        publishersOrError: 'loading',
        name: '',
    }

    private submits = new Subject<React.FormEvent<HTMLFormElement>>()
    private componentUpdates = new Subject<Props>()
    private subscriptions = new Subscription()

    public componentDidMount(): void {
        eventLogger.logViewEvent('ExtensionRegistryCreateExtension')

        this.subscriptions.add(
            concat(
                [{ publishersOrError: 'loading' }],
                queryViewerRegistryPublishers().pipe(
                    map(result => ({ publishersOrError: result, publisher: result[0] && result[0].id })),
                    catchError(error => [{ publishersOrError: asError(error) }])
                )
            ).subscribe(stateUpdate => this.setState(stateUpdate as State), err => console.error(err))
        )

        this.subscriptions.add(
            this.submits
                .pipe(
                    tap(e => e.preventDefault()),
                    concatMap(() =>
                        concat(
                            [{ creationOrError: 'loading' }],
                            createExtension(this.state.publisher!, this.state.name).pipe(
                                switchMap(result =>
                                    configureNewExtensionAsDisabled(result.extension.extensionID).pipe(mapTo(result))
                                ),
                                tap(result => {
                                    // Go to the page for the newly created extension.
                                    this.props.history.push(result.extension.url)
                                }),
                                map(result => ({ creationOrError: result })),
                                catchError(error => [{ creationOrError: asError(error) }])
                            )
                        )
                    )
                )
                .subscribe(stateUpdate => this.setState(stateUpdate as State), err => console.error(err))
        )

        this.componentUpdates.next(this.props)
    }

    public componentWillReceiveProps(nextProps: Props): void {
        this.componentUpdates.next(nextProps)
    }

    public componentWillUnmount(): void {
        this.subscriptions.unsubscribe()
    }

    public render(): JSX.Element | null {
        // If not logged in, redirect to sign in
        if (!this.props.authenticatedUser) {
            const newUrl = new URL(window.location.href)
            newUrl.pathname = '/sign-in'
            // Return to the current page after sign up/in.
            newUrl.searchParams.set('returnTo', window.location.href)
            return <Redirect to={newUrl.pathname + newUrl.search} />
        }

        let extensionID: string | undefined
        if (
            this.state.publishersOrError !== 'loading' &&
            !isErrorLike(this.state.publishersOrError) &&
            this.state.publisher
        ) {
            const p = this.state.publishersOrError.find(p => p.id === this.state.publisher)
            if (p) {
                extensionID = toExtensionID(p, this.state.name)
            }
        }

        return (
            <>
                <PageTitle title="New extension" />
                <ModalPage className="registry-new-extension-page">
                    <h2>
                        <PuzzleIcon className="icon-inline" /> New extension
                    </h2>
                    <Form onSubmit={this.onSubmit}>
                        <RegistryPublisherFormGroup
                            value={this.state.publisher}
                            publishersOrError={this.state.publishersOrError}
                            onChange={this.onPublisherChange}
                            disabled={this.state.creationOrError === 'loading'}
                        />
                        <RegistryExtensionNameFormGroup
                            value={this.state.name}
                            disabled={this.state.creationOrError === 'loading'}
                            onChange={this.onNameChange}
                        />
                        {extensionID && (
                            <div className="form-group d-flex flex-wrap align-items-baseline">
                                <label
                                    htmlFor="extension-registry-create-extension-page__extensionID"
                                    className="mr-1 mb-0 mt-1"
                                >
                                    Extension ID:
                                </label>
                                <code
                                    id="extension-registry-create-extension-page__extensionID"
                                    className="registry-new-extension-page__extension-id mt-1"
                                >
                                    <strong>{extensionID}</strong>
                                </code>
                            </div>
                        )}
                        <button
                            type="submit"
                            disabled={
                                isErrorLike(this.state.publishersOrError) ||
                                this.state.publishersOrError === 'loading' ||
                                this.state.creationOrError === 'loading'
                            }
                            className="btn btn-primary"
                        >
                            {this.state.creationOrError === 'loading' ? (
                                <LoaderIcon className="icon-inline" />
                            ) : (
                                <AddIcon className="icon-inline" />
                            )}{' '}
                            Create extension
                        </button>
                    </Form>
                    {isErrorLike(this.state.creationOrError) && (
                        <div className="alert alert-danger mt-3">{upperFirst(this.state.creationOrError.message)}</div>
                    )}
                </ModalPage>
            </>
        )
    }

    private onPublisherChange: React.ChangeEventHandler<HTMLSelectElement> = e =>
        this.setState({ publisher: e.currentTarget.value })

    private onNameChange: React.ChangeEventHandler<HTMLInputElement> = e =>
        this.setState({ name: e.currentTarget.value })

    private onSubmit: React.FormEventHandler<HTMLFormElement> = e => this.submits.next(e)
}
