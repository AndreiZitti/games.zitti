import React, { Component } from "react";
import PropTypes from "prop-types";
import "./PolicyDisplay.css";
import { LIBERAL } from "../constants";

class PolicyDisplay extends Component {
	render() {
		const { themeAssets } = this.props;
		// Use themed assets if provided, otherwise fall back to original
		const liberalPolicy = themeAssets?.policyLiberal || "/secret-hitler/policy-liberal.png";
		const fascistPolicy = themeAssets?.policyFascist || "/secret-hitler/policy-fascist.png";

		return (
			<div id={"legislative-policy-container"}>
				{this.props.policies.map((value, index) => {
					let policyName = value === LIBERAL ? "liberal" : "fascist";
					return (
						<img
							id={"legislative-policy"}
							key={index}
							className={
								this.props.allowSelection
									? "selectable " +
									  (index === this.props.selection ? " selected" : "")
									: ""
							}
							onClick={() => this.props.onClick(index)}
							disabled={!this.props.allowSelection}
							src={value === LIBERAL ? liberalPolicy : fascistPolicy}
							alt={
								"A " +
								policyName +
								" policy." +
								(this.props.allowSelection ? " Click to select." : "")
							}
						/>
					);
				})}
			</div>
		);
	}
}

PolicyDisplay.propTypes = {
	policies: PropTypes.array.isRequired,
	onClick: PropTypes.func,
	selection: PropTypes.number,
	allowSelection: PropTypes.bool,
	themeAssets: PropTypes.object,
};

export default PolicyDisplay;
