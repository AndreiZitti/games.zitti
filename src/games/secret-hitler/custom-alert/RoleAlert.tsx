import React, { Component } from "react";

import "./RoleAlert.css";
import { GameState, Role } from "../types";
import { ThemeAssets, ThemeLabels } from "../assets/themes";

// Alt text for role cards (describes the original artwork)
const LiberalImagesAltText = [
  "Your secret role card shows a bespectacled man with a pipe giving a side-eye.",
  "Your secret role card shows an elegant woman with curly hair and pearls.",
  "Your secret role card shows a round-chinned man in a pilgrim-esque hat gazing quizzically at the camera.",
  "Your secret role card shows a sharp-suited man sporting a fedora and a neatly-trimmed mustache.",
  "Your secret role card shows an elderly woman with comically large glasses holding a chihuahua.",
  "Your secret role card shows a woman with a large sun hat and shoulder-length bob smirking.",
];
const HitlerImagesAltText = [
  "Your secret role card shows a crocodile in a suit and WW2 German military hat glaring at the camera.",
];
const FascistImagesAltText = [
  "Your secret role card shows a snake emerging from a suit covered in military medals.",
  "Your secret role card shows an iguana in a German military hat and suit with fangs bared.",
  "Your secret role card shows an iguana in a German military hat and suit with fangs bared.",
];

type RoleAlertProps = {
  role?: Role;
  name: string;
  gameState: GameState;
  onClick: () => void;
  themeAssets: ThemeAssets;
  themeLabels: ThemeLabels;
};

/**
 * CustomAlert content that shows the player's current role and a quick guide on how to play
 * the game.
 * Parameters:
 *      - {@code role} [String]: The role of the player. Should be either LIBERAL, FASCIST, or HITLER.
 *      - {@code roleID} [int]: The integer roleID of the player. This is used to show unique role cards.
 *          The roleID can range from [1, 6] for LIBERALS, [1, 3] for FASCISTS, and [1] for HITLER. If out of bounds,
 *          the value is set to 1 (default).
 *      - {@code onClick} [()]: The callback function for when confirmation button ("OKAY") is pressed.
 */
class RoleAlert extends Component<RoleAlertProps> {
  getRoleImageAndAlt(): { image: string; alt: string } {
    const { themeAssets, role, gameState, name } = this.props;
    let images: string[];
    let imageAlts: string[];

    switch (role) {
      case Role.LIBERAL:
        images = [
          themeAssets.roleLiberal1,
          themeAssets.roleLiberal2,
          themeAssets.roleLiberal3,
          themeAssets.roleLiberal4,
          themeAssets.roleLiberal5,
          themeAssets.roleLiberal6,
        ];
        imageAlts = LiberalImagesAltText;
        break;
      case Role.FASCIST:
        images = [
          themeAssets.roleFascist1,
          themeAssets.roleFascist2,
          themeAssets.roleFascist3,
        ];
        imageAlts = FascistImagesAltText;
        break;
      default: // Hitler
        images = [themeAssets.roleHitler];
        imageAlts = HitlerImagesAltText;
    }
    const playerIndex = gameState.playerOrder.indexOf(name);
    const roleId = playerIndex % images.length;

    return {
      image: images[roleId],
      alt: imageAlts[roleId],
    };
  }

  getRoleText(): string[] {
    const { role, themeLabels } = this.props;
    const { hitler, liberalPolicies, fascistPolicies, fascistParty } = themeLabels;

    if (role === Role.LIBERAL) {
      return [
        `You win if the board fills with ${liberalPolicies}, or if ${hitler} is executed.`,
        `You lose if the board fills with ${fascistPolicies}, or if ${hitler} is elected chancellor after 3 ${fascistPolicies} are passed.`,
        `Keep your eyes open and look for suspicious actions. Find ${hitler}, and remember that anyone might be lying!`,
      ];
    } else if (role === Role.FASCIST) {
      return [
        `You win if ${hitler} is successfully elected chancellor once 3 ${fascistPolicies} are on the board, or if the board fills with ${fascistPolicies}.`,
        `You lose if the board fills with ${liberalPolicies} or if ${hitler} is executed.`,
        `Keep suspicion off of ${hitler} and look for ways to throw confusion into the game.`,
      ];
    } else {
      // Hitler
      return [
        `You win if you are successfully elected chancellor once 3 ${fascistPolicies} are on the board, or if the board fills with ${fascistPolicies}.`,
        `You lose if the board fills with ${liberalPolicies} or if you are executed.`,
        `Try to gain trust and rely on the other ${fascistParty} to open opportunities for you.`,
      ];
    }
  }

  getRoleLabel(): string {
    const { role, themeLabels } = this.props;
    switch (role) {
      case Role.LIBERAL:
        return themeLabels.youAre.liberal;
      case Role.FASCIST:
        return themeLabels.youAre.fascist;
      default:
        return themeLabels.youAre.hitler;
    }
  }

  render() {
    const roleText = this.getRoleText();
    const roleLabel = this.getRoleLabel();
    const { image, alt } = this.getRoleImageAndAlt();

    return (
      <div>
        <div>
          <h2 id="alert-header" className={"left-align"}>
            {roleLabel}
          </h2>
          <img id="role" src={image} alt={alt} />

          <p className={"left-align"}>{roleText[0]}</p>
          <p className={"left-align"}>{roleText[1]}</p>
          <p className="highlight left-align">{roleText[2]}</p>
        </div>

        <button onClick={this.props.onClick}>OKAY</button>
      </div>
    );
  }
}

export default RoleAlert;
