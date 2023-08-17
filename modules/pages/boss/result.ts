import { GM } from "../../../IncrementalWar";
import { PageClass } from "../../base_classes";
import { BossFightingPage } from "./fighting";

class BossFightingResultPageClass extends PageClass {
  resultInfo: HTMLElement;
  backButton: HTMLElement;
  constructor(name: string) {
    super(name);

    this.resultInfo = $("#AfterFightMessage").get(0)!;
    this.backButton = $("#BackButtonFromResults").get(0)!;

    this.initializeEventListeners();
  }
  initializeEventListeners() {
    //Back to tower page button
    this.backButton.addEventListener("click", () => {
      //get resource bar and page buttons back
      const pageButtonsContainer = $("#PageButtonsContainer").get(0)!;
      pageButtonsContainer.hidden = false;
      const pageTopResourcesContainer = $("#PageTopResourcesContainer").get(0)!;
      pageTopResourcesContainer.hidden = false;
      //return to tower page
      GM.hidePages("TowerPage");
    });
  }
  displayOnLoad() { }
  display() {
    this.resultInfo.innerHTML = this.generateMessage();
  }
  displayEveryTick() { }
  save() {
    const saveText = super.save();

    return saveText;
  }
  load(saveText: string) {
    const saveTextArr: string[] = saveText.split("/*/");
    const i = super.load(saveTextArr);
    return i;
  }
  generateMessage() {
    let t;
    if (BossFightingPage.fightingArmiesNr == 0) {
      t = "You lost!<br>";
      if (BossFightingPage.fight?.loseSoldiers) {
        t += "With your loss, you lost all your soldiers as well!";
      }
      else {
        t += "Don't worry though, you didn't lose anyone, the magic of the Tower kept them all alive.";
      }

    }
    else {
      t = "You won!<br>";
      if (BossFightingPage.fight?.loseSoldiers) {
        t += "Though you lost part of your army.";
      }
      else {
        t += "Thank you for playing the game! <br> If you have a minute, I would really appreciate it if " +
          "you could give me some feedback through <a href=\"https://forms.gle/rMwKTcsQJGxfFLDN8\">a survey here</a> or in private.<br> Thank you for your time again!";
      }
    }
    return t;
  }
}

export const BossFightingResultPage = new BossFightingResultPageClass("BossFightingResultPage")