import React, { Component } from "react";
import PropTypes from "prop-types";
import ButtonPrompt from "./ButtonPrompt";

// Static paths
const LiberalPolicy = "/secret-hitler/policy-liberal.png";
const FascistPolicy = "/secret-hitler/policy-fascist.png";
const FolderCoverFront = "/secret-hitler/policy-folder-cover-front.png";
const FolderCoverBack = "/secret-hitler/policy-folder-cover-back.png";
const FolderBack = "/secret-hitler/policy-folder-back.png";

import "./PolicyEnactedAlert.css";
import { LIBERAL } from "../constants";

class PolicyEnactedAlert extends Component {
  shiftAnimationTimeout;
  flipAnimationTimeout;

  constructor(props) {
    super(props);
    this.state = {
      className: "",
    };
  }

  componentDidMount() {
    // Set up animations
    this.shiftAnimationTimeout = setTimeout(() => {
      this.setState({ className: "show-policy-shift" });
    }, 500);
    this.flipAnimationTimeout = setTimeout(() => {
      this.setState({ className: "show-policy-flip show-policy-shift" });
    }, 1000);
  }

  componentWillUnmount() {
    clearTimeout(this.shiftAnimationTimeout);
    clearTimeout(this.flipAnimationTimeout);
  }

  render() {
    return (
      <ButtonPrompt
        renderLabel={() => {
          return <h2 className={"left-align"}>POLICY ENACTED</h2>; // aligns text with center
        }}
        buttonText={"OKAY"}
        buttonOnClick={this.props.hideAlert}
      >
        <div id={"policy-enacted-container"}>
          <img
            id={"policy-enacted-back"}
            className={this.state.className}
            src={FolderBack}
            alt={""}
          />
          <img
            id={"policy-enacted-policy"}
            className={this.state.className}
            src={
              this.props.policyType === LIBERAL ? LiberalPolicy : FascistPolicy
            }
            alt={
              "A " +
                this.props.policyType.toLowerCase() +
                " policy that was enacted! " +
                this.props.policyType ===
              LIBERAL
                ? "It's printed in blue with a dove insignia on it."
                : "It's printed in red with a skull insignia on it."
            }
          />
          <img
            id={"policy-enacted-cover-back"}
            src={FolderCoverBack}
            className={this.state.className}
            alt={"A manila folder labeled 'New Policy.'"}
          />
          <img
            id={"policy-enacted-cover-front"}
            src={FolderCoverFront}
            className={this.state.className}
            alt={"A manila folder labeled 'New Policy.'"}
          />
        </div>
      </ButtonPrompt>
    );
  }
}

PolicyEnactedAlert.propTypes = {
  hideAlert: PropTypes.func.isRequired,
  policyType: PropTypes.string.isRequired,
};

export default PolicyEnactedAlert;
