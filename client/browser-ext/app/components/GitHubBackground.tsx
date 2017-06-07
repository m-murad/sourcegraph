import * as React from "react";
import * as backend from "../backend";
import { ExtensionEventLogger } from "../tracking/ExtensionEventLogger";
import * as utils from "../utils";
import { eventLogger } from "../utils/context";
import * as tooltips from "../utils/tooltips";

export class GitHubBackground extends React.Component<{}, {}> {

	componentDidMount(): void {
		document.addEventListener("pjax:end", this.cleanupAndRefresh);
		window.addEventListener("popstate", this.popstateUpdate);
		this.cleanupAndRefresh();
	}

	componentWillUpdate(nextProps: {}): void {
		// Call refresh with new props (since this.props are not updated until this method completes).
		this.refresh();
	}

	componentWillUnmount(): void {
		document.removeEventListener("pjax:end", this.cleanupAndRefresh);
		document.removeEventListener("popstate", this.popstateUpdate);
	}

	private cleanupAndRefresh = (): void => {
		// Clean up any tooltips on the page before refreshing (after pjax:success).
		// Otherwise, tooltips may remain on the page because the anchored elem's mousout
		// event may not have fired (and the elem may no longer be on the page).
		tooltips.hideTooltip();
		this.refresh();

		// Remove all ".sg-annotated"; this allows tooltip event handlers to be re-registered.
		const sgAnnotated = document.querySelectorAll(".sg-annotated");
		// tslint:disable-next-line
		for (let i = 0; i < sgAnnotated.length; ++i) {
			(sgAnnotated.item[i] as HTMLElement).className = (sgAnnotated.item[i] as HTMLElement).className.replace(/sg-annotated/, "");
		}
	}

	private popstateUpdate = (): void => {
		tooltips.hideTooltip();
	}

	private refresh = (): void => {
		(eventLogger as ExtensionEventLogger).updateIdentity();
	}

	render(): JSX.Element | null {
		return null; // the injected app is for bootstrapping; nothing needs to be rendered
	}
}
