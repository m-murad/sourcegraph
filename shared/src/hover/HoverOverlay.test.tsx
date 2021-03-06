import { HoverAttachment } from '@sourcegraph/codeintellify/lib/types'
import { registerLanguage } from 'highlight.js/lib/highlight'
import * as H from 'history'
import { castArray } from 'lodash'
import React from 'react'
import renderer from 'react-test-renderer'
import { createRenderer } from 'react-test-renderer/shallow'
import { MarkupKind } from 'sourcegraph'
import { HoverMerged } from '../api/client/types/hover'
import { HoverOverlay, HoverOverlayProps } from './HoverOverlay'

const renderShallow = (element: React.ReactElement<HoverOverlayProps>): React.ReactElement<any> => {
    const renderer = createRenderer()
    renderer.render(element)
    // Render again because the first render call only renders the <TelemetryContext.Consumer> element, whose child
    // is a render prop that returns what we actually want.
    renderer.render(renderer.getRenderOutput().props.children())
    return renderer.getRenderOutput()
}

describe('HoverOverlay', () => {
    const NOOP_EXTENSIONS_CONTROLLER = { executeCommand: async () => void 0 }
    const NOOP_PLATFORM_CONTEXT = { forceUpdateTooltip: () => void 0 }
    const history = H.createMemoryHistory({ keyLength: 0 })
    const commonProps: HoverOverlayProps = {
        location: history.location,
        extensionsController: NOOP_EXTENSIONS_CONTROLLER,
        platformContext: NOOP_PLATFORM_CONTEXT,
        showCloseButton: false,
        hoveredToken: { repoName: 'r', commitID: 'c', rev: 'v', filePath: 'f', line: 1, character: 2 },
        overlayPosition: { left: 0, top: 0 },
    }

    test('actions and hover undefined', () => {
        expect(renderer.create(<HoverOverlay {...commonProps} />).toJSON()).toMatchSnapshot()
    })

    test('actions loading', () => {
        expect(renderer.create(<HoverOverlay {...commonProps} actionsOrError="loading" />).toJSON()).toMatchSnapshot()
    })

    test('hover loading', () => {
        expect(renderer.create(<HoverOverlay {...commonProps} hoverOrError="loading" />).toJSON()).toMatchSnapshot()
    })

    test('actions and hover loading', () => {
        expect(
            renderer.create(<HoverOverlay {...commonProps} actionsOrError="loading" hoverOrError="loading" />).toJSON()
        ).toMatchSnapshot()
    })

    test('actions empty', () => {
        const component = renderer.create(<HoverOverlay {...commonProps} actionsOrError={[]} />)
        expect(component.toJSON()).toMatchSnapshot()
    })

    test('hover empty', () => {
        expect(renderer.create(<HoverOverlay {...commonProps} hoverOrError={null} />).toJSON()).toMatchSnapshot()
    })

    test('actions and hover empty', () => {
        expect(
            renderer.create(<HoverOverlay {...commonProps} actionsOrError={[]} hoverOrError={null} />).toJSON()
        ).toMatchSnapshot()
    })

    test('actions present', () => {
        expect(
            renderShallow(
                <HoverOverlay
                    {...commonProps}
                    actionsOrError={[{ action: { id: 'a', command: 'c', title: 'Some title' } }]}
                />
            )
        ).toMatchSnapshot()
    })

    test('hover present', () => {
        expect(
            renderer
                .create(
                    <HoverOverlay
                        {...commonProps}
                        hoverOrError={{ contents: [{ kind: MarkupKind.Markdown, value: 'v' }] }}
                    />
                )
                .toJSON()
        ).toMatchSnapshot()
    })

    test('multiple hovers present', () => {
        expect(
            renderer
                .create(
                    <HoverOverlay
                        {...commonProps}
                        hoverOrError={{
                            contents: [
                                { kind: MarkupKind.Markdown, value: 'v' },
                                { kind: MarkupKind.Markdown, value: 'v2' },
                            ],
                        }}
                    />
                )
                .toJSON()
        ).toMatchSnapshot()
    })

    test('actions and hover present', () => {
        expect(
            renderShallow(
                <HoverOverlay
                    {...commonProps}
                    actionsOrError={[{ action: { id: 'a', command: 'c' } }]}
                    hoverOrError={{ contents: [{ kind: MarkupKind.Markdown, value: 'v' }] }}
                />
            )
        ).toMatchSnapshot()
    })

    test('actions present, hover loading', () => {
        expect(
            renderShallow(
                <HoverOverlay
                    {...commonProps}
                    actionsOrError={[{ action: { id: 'a', command: 'c' } }]}
                    hoverOrError="loading"
                />
            )
        ).toMatchSnapshot()
    })

    test('hover present, actions loading', () => {
        expect(
            renderShallow(
                <HoverOverlay
                    {...commonProps}
                    actionsOrError="loading"
                    hoverOrError={{ contents: [{ kind: MarkupKind.Markdown, value: 'v' }] }}
                />
            )
        ).toMatchSnapshot()
    })

    test('actions error', () => {
        expect(
            renderShallow(<HoverOverlay {...commonProps} actionsOrError={{ message: 'm', code: 'c' }} />)
        ).toMatchSnapshot()
    })

    test('hover error', () => {
        expect(
            renderShallow(<HoverOverlay {...commonProps} hoverOrError={{ message: 'm', code: 'c' }} />)
        ).toMatchSnapshot()
    })

    test('actions and hover error', () => {
        expect(
            renderShallow(
                <HoverOverlay
                    {...commonProps}
                    actionsOrError={{ message: 'm1', code: 'c1' }}
                    hoverOrError={{ message: 'm2', code: 'c2' }}
                />
            )
        ).toMatchSnapshot()
    })

    test('actions error, hover present', () => {
        expect(
            renderShallow(
                <HoverOverlay
                    {...commonProps}
                    actionsOrError={{ message: 'm', code: 'c' }}
                    hoverOrError={{ contents: [{ kind: MarkupKind.Markdown, value: 'v' }] }}
                />
            )
        ).toMatchSnapshot()
    })

    test('hover error, actions present', () => {
        expect(
            renderShallow(
                <HoverOverlay
                    {...commonProps}
                    actionsOrError={[{ action: { id: 'a', command: 'c' } }]}
                    hoverOrError={{ message: 'm', code: 'c' }}
                />
            )
        ).toMatchSnapshot()
    })

    describe('hover content rendering', () => {
        const renderMarkdownHover = (hover: HoverAttachment & HoverMerged) => {
            const contents = castArray(
                renderShallow(<HoverOverlay {...commonProps} hoverOrError={hover} />).props.children
            ).find(e => e.props && e.props.className && e.props.className.includes('hover-overlay__contents'))
            if (!contents) {
                return null
            }
            return castArray(contents.props.children)
                .map(c => {
                    if (c.props && c.props.className && c.props.className.includes('hover-overlay__content')) {
                        if (typeof c.props.children === 'string') {
                            return c.props.children
                        }
                        return c.props.dangerouslySetInnerHTML.__html
                    }
                    return ''
                })
                .join('')
                .trim()
        }

        const renderPlainTextHover = (hover: HoverAttachment & HoverMerged) =>
            renderer
                .create(<HoverOverlay {...commonProps} hoverOrError={hover} />)
                .root.find(c => c.props && c.props.className && c.props.className.includes('hover-overlay__content'))
                .props.children.map((c: renderer.ReactTestInstance) => c.props.children)

        test('MarkupKind.Markdown', () => {
            expect(renderMarkdownHover({ contents: [{ kind: MarkupKind.Markdown, value: '*v*' }] })).toEqual(
                '<p><em>v</em></p>'
            )
        })

        test('MarkupKind.PlainText', () => {
            expect(renderPlainTextHover({ contents: [{ kind: MarkupKind.PlainText, value: 'v<' }] })).toEqual(['v<'])
        })

        test('code', () => {
            registerLanguage('testlang', x => ({}))
            expect(
                renderMarkdownHover({ contents: [{ kind: MarkupKind.Markdown, value: '```testlang\n<>\n```' }] })
            ).toEqual('<pre><code class="language-testlang">&lt;&gt;</code></pre>')
        })
    })
})
