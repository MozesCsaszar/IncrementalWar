class BossArmySelectionPageClass extends PageClass {
  fight?: Fight;
  nrArmySelects: number;
  armySelects: BossSelectArmyButtonsClass[];
  armyInfos: HTMLElement[];
  nrArmies: number;
  bossInfo: HTMLElement;
  difficultyGauge: HTMLElement;
  backButton: HTMLElement;
  startFightButton: HTMLElement;
  timesVisited: number = 0;
  constructor(name: string) {
    super(name);

    this.nrArmies = 3;
    this.nrArmySelects = 3;
    //build armySelects component
    this.armySelects = [];
    for (let i = 0; i < this.nrArmies; i++) {
      this.armySelects.push(new BossSelectArmyButtonsClass(
        ".toggle_button_container.page_boss_select_army", ".toggle_button",
        { "borderColor": "var(--selected-toggle-button-border-color)" },
        { "borderColor": "var(--default-toggle-button-border-color)" }, i
      ));
    }
    this.armyInfos = $(".select_boss_army_info").toArray();
    this.bossInfo = $("#BossInfo").get(0)!;
    this.difficultyGauge = $("#BossFightDifficultyGauge").get(0)!;
    this.fight = undefined;
    this.backButton = $("#BackFromBossArmySelectionPage").get(0)!;
    this.startFightButton = $("#StartBossFightButton").get(0)!;

    this.initializeEventListeners();
  }
  initializeEventListeners() {
    //start fight button
    this.startFightButton.addEventListener("click", () => {
      //reset boss fight page
      BossFightingPage.reset();
      BossFightingPage.fight = this.fight;
      for (let i = 0; i < this.fight!.maxSelectibleArmies; i++) {
        if (this.fight!.selectedArmies[i] != -1) {
          const result = TowerPage.Tower.removeRaidedLevelByArmy(this.fight!.selectedArmies[i]);
          if (result != undefined) {
            BossFightingPage.armiesRemovedFrom.push();
          }
        }
      }
      this.reset();
      GM.("BossFightingPage");
    });
    //Back to tower page button
    this.backButton.addEventListener("click", () => {
      //get page buttons back
      $("#PageButtonsContainer").show();
      $("#PageTopResourcesContainer").show();
      //return to tower page
      HidePages("TowerPage");
    });
  }
  displayOnLoad() { }
  display() {
    //show necessary army selects
    for (let i = 0; i < this.fight!.maxSelectibleArmies; i++) {
      this.armySelects[i].container.parentElement.hidden = false;
      this.armySelects[i].deselect();
    }
    //hide ones that are not useable in current fight
    for (let i = this.fight!.maxSelectibleArmies; i < this.nrArmySelects; i++) {
      this.armySelects[i].container.parentElement.hidden = true;
    }
    this.bossInfo.innerHTML = stuff.bosses[this.fight!.bosses[0]].getText();
    if (this.timesVisited == 0) {
      TutorialPage.unlockTutorial("Boss Fighting Army Selection Page");
      TutorialPage.startTutorial("Boss Fighting Army Selection Page", true, "BossArmySelectionPage");
    }
    this.timesVisited++;
  }
  save() {
    const saveText = super.save();

    return saveText;
  }
  load(saveText: string) {
    const saveTextArr = saveText.split("/*/");
    const i = super.load(saveTextArr);
    return i;
  }
  showHideFightButton() {
    for (const i in this.fight!.selectedArmies) {
      if (this.fight!.selectedArmies[i] != -1 &&
        Player.armies[this.fight!.selectedArmies[i]].creature != "None") {
        this.startFightButton.hidden = false;
        return;
      }
    }
    this.startFightButton.hidden = true;
  }
  reset() {
    this.startFightButton.hidden = true;
    for (let i = 0; i < this.fight!.maxSelectibleArmies; i++) {
      this.armySelects[i].selectButton([this.fight!.selectedArmies[i]]);
      this.armyInfos[i].innerHTML = "No army to be seen here.";
    }
  }
}

const BossArmySelectionPage = new BossArmySelectionPageClass("BossArmySelectionPage");