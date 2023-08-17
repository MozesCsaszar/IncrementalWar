type FeedElement = [FightingBoss, [number, number]];

class BossFightingPageClass extends PageClass {
  feedMoves: FeedElement[];
  feedElements: HTMLElement[] = [];
  fight?: Fight;
  armiesRemovedFrom: any;
  barWidth: number;
  nrArmyStatusBars: number;
  barElementsPerArmy: number;
  armyStatusBars: HTMLElement[][];
  nrBossStatusBats: number;
  barElementsPerBoss: number;
  bossStatusBars: HTMLElement[][];
  fightingArmies: FightingArmy[] = [];
  fightingBosses: FightingBoss[] = [];
  fightingArmyStatuses: number[] = [];
  fightingBossStatuses: number[] = [];
  fightingArmiesNr: number;
  fightingBossesNr: number;
  timesVisited: number = 0;
  constructor(name: string) {
    super(name);

    this.fight = undefined;

    //applicable to all status bars
    this.barWidth = 300;

    //army status bars
    this.nrArmyStatusBars = 3;
    this.barElementsPerArmy = 6;
    this.armyStatusBars = [];

    let statusBars = $(".army_in_boss_fight_bar").toArray();
    for (let i = 0; i < this.nrArmyStatusBars; i++) {
      this.armyStatusBars.push([]);
      for (let j = 0; j < this.barElementsPerArmy; j++) {
        this.armyStatusBars[i].push(statusBars[i * this.barElementsPerArmy + j]);
      }
    }

    //boss status bars
    this.nrBossStatusBats = 1;
    this.barElementsPerBoss = 6;
    this.bossStatusBars = [];

    statusBars = $(".boss_in_boss_fight_bar").toArray();
    for (let i = 0; i < this.nrBossStatusBats; i++) {
      this.bossStatusBars.push([]);
      for (let j = 0; j < this.barElementsPerBoss; j++) {
        this.bossStatusBars[i].push(statusBars[i * this.barElementsPerBoss + j]);
      }
    }

    //feed
    this.feedElements = [];
    this.feedMoves = [];
    this.feedElements = $(".boss_fight_move_feedElement").toArray();

    this.fightingArmies = [];
    this.fightingBosses = [];
    this.fightingArmyStatuses = [];
    this.fightingBossStatuses = [];
    this.fightingArmiesNr = 0;
    this.fightingBossesNr = 0;
    this.armiesRemovedFrom = [];

    this.initializeEventListeners();
  }
  initializeEventListeners() {
    //feed elements
    for (let i = 0; i < this.feedElements.length; i++) {
      this.feedElements[i].addEventListener("mouseenter", (event) => {
        if (this.feedElements[i].innerHTML != "") {
          //display anew only if mouse was moved
          if (!(PopupWindow.left == event.clientX && PopupWindow.top == event.clientY)) {
            const feedElem = this.feedMoves[this.feedMoves.length - 1 - i];
            PopupWindow.show(event.clientX, event.clientY, feedElem[0].moveset.getMove_description(...feedElem[1]));
          }
        }
      });
      this.feedElements[i].addEventListener("mousemove", (event) => {
        const feedElem = this.feedMoves[this.feedMoves.length - 1 - i];
        PopupWindow.show(event.clientX, event.clientY, feedElem[0].moveset.getMove_description(...feedElem[1]));
      });
      this.feedElements[i].addEventListener("mouseleave", () => {
        PopupWindow.hide();
      });
    }
  }
  displayOnLoad() {
  }
  display() {
    //if not yet visited, show tutorial
    if (this.timesVisited == 0) {
      TutorialPage.unlockTutorial("Boss Fighting Page");
      TutorialPage.startTutorial("Boss Fighting Page", true, "BossFightingPage");
    }
    //else set up the fight
    else {
      for (let i = 0; i < this.fight!.maxSelectibleArmies; i++) {
        this.armyStatusBars[i][0].parentElement!.parentElement!.hidden = false;
        //create actually fighting armies
        this.fightingArmies.push(new FightingArmy(Player.armies[this.fight!.selectedArmies[i]]));
        this.fightingArmyStatuses.push(1);
      }
      this.fightingArmiesNr = this.fight!.maxSelectibleArmies;

      for (let i = this.fight!.maxSelectibleArmies; i < this.nrArmyStatusBars; i++) {
        this.armyStatusBars[i][0].parentElement!.parentElement!.hidden = true;
        this.fightingBossStatuses.push(1);
      }
      this.fightingBossesNr = 1;

      //create actually fighting boss
      this.fightingBosses.push(new FightingBoss(stuff["bosses"][this.fight!.bosses[0]]));
      this.deployArmies();
      const boss_in_boss_fight_name = $(".boss_in_boss_fight_name").get(0)!;
      boss_in_boss_fight_name.innerHTML = this.fight!.bosses[0];
    }
    this.timesVisited++;
  }
  displayEveryTick() {
    //fill in sliders
    for (let i = 0; i < this.fightingArmies.length; i++) {
      //health foreground
      this.armyStatusBars[i][0].style.width = this.getWidth(this.fightingArmies[i].totalHealth, this.fightingArmies[i].maxTotalHealth) + "";
      this.armyStatusBars[i][1].innerHTML = stylizeDecimals(this.fightingArmies[i].totalHealth) + "/" + stylizeDecimals(this.fightingArmies[i].maxTotalHealth);
      //unit nr foreground
      this.armyStatusBars[i][2].style.width = this.getWidth(this.fightingArmies[i].units, this.fightingArmies[i].maxUnits) + "";
      this.armyStatusBars[i][3].innerHTML = stylizeDecimals(this.fightingArmies[i].units, true) + "/" + stylizeDecimals(this.fightingArmies[i].maxUnits, true) +
        " (" + stylizeDecimals(this.fightingArmies[i].deployed, true) + ")";
      //attack status foreground
      this.armyStatusBars[i][4].style.width = this.getWidth(this.fightingArmies[i].attackCounter, this.fightingArmies[i].attackTime) + "";
      this.armyStatusBars[i][5].innerHTML = stylizeDecimals(this.fightingArmies[i].getTotalAttack(this.fightingBosses[0]));
    }

    for (let i = 0; i < this.fightingBosses.length; i++) {
      //health foreground
      this.bossStatusBars[i][0].style.width = this.getWidth(this.fightingBosses[i].totalHealth, this.fightingBosses[i].maxTotalHealth) + "";
      this.bossStatusBars[i][1].innerHTML = stylizeDecimals(this.fightingBosses[i].totalHealth) + "/" + stylizeDecimals(this.fightingBosses[i].maxTotalHealth) + "";
      //unit nr foreground
      this.bossStatusBars[i][2].style.width = this.getWidth(this.fightingBosses[i].units, this.fightingBosses[i].maxUnits) + "";
      this.bossStatusBars[i][3].innerHTML = stylizeDecimals(this.fightingBosses[i].units, true) + "/" + stylizeDecimals(this.fightingBosses[i].maxUnits, true);
      //attack status foreground
      this.bossStatusBars[i][4].style.width = this.getWidth(this.fightingBosses[i].attackCounter, this.fightingBosses[i].attackTime) + "";
      this.bossStatusBars[i][5].innerHTML = stylizeDecimals(this.fightingBosses[i].getTotalAttack());
    }

    if (this.doFight()) {
      this.resolve_win();
    }
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
  deployArmies() {
    for (let i = 0; i < this.fightingArmies.length; i++) {
      this.fightingArmies[i].deploy_around_boss(this.fightingBosses[0]);
    }
    this.fightingBosses[0].getTargets();
  }
  getWidth(curr: Decimal, max: Decimal) {
    return new Decimal(this.barWidth).mul(curr.div(max)).floor().toNumber();
  }
  doFight() {
    for (let i = 0; i < this.fightingArmies.length; i++) {
      if (this.fightingArmyStatuses[i] == 1) {
        this.fightingArmies[i].tick(20, this.fightingBosses[0]);
        if (this.fightingArmies[i].totalHealth.lte(0.00001)) {
          this.fightingArmyStatuses[i] = 0;
          this.fightingArmies[i].totalHealth = new Decimal(0);
          this.fightingArmiesNr -= 1;
          if (this.fightingArmiesNr == 0) {
            return true;
          }
        }
      }

    }

    for (let i = 0; i < this.fightingBosses.length; i++) {
      if (this.fightingBossStatuses[i] == 1) {
        this.fightingBosses[i].tick(20);
        if (this.fightingBosses[i].totalHealth.lte(0.00001)) {
          this.fightingBossStatuses[i] = 0;
          this.fightingBosses[i].totalHealth = new Decimal(0);
          this.fightingBossesNr -= 1;
          if (this.fightingBossesNr == 0) {
            return true;
          }
        }
      }

    }
  }
  resolve_win() {
    // //Boss won
    // if (this.fightingArmiesNr == 0) {

    // }
    // //Army won
    // else {

    // }
    //put armies back to raid what they were raiding before
    for (let i = 0; i < this.armiesRemovedFrom.length; i++) {
      TowerPage.Tower.raidedLevels.push(this.armiesRemovedFrom[i]);
    }

    //change page to fight end page
    HidePages("BossFightingResultPage");
  }
  update_feed() {
    let i, ii = this.feedMoves.length - 1;
    for (i = 0; i < this.feedMoves.length; i++, ii--) {
      this.feedElements[ii].innerHTML = "<br>" + this.feedMoves[i][0].moveset.getMoveName(...this.feedMoves[i][1]) + "<br>";
    }
    for (i; i < this.feedElements.length; i++) {
      this.feedElements[i].innerHTML = "";
    }
  }
  reset() {
    //reset fighting armies and bosses
    this.fightingArmies = [];
    this.fightingArmiesNr = 0;
    this.fightingBosses = [];
    this.fightingBossesNr = 0;
    this.fightingArmyStatuses = [];
    this.fightingBossStatuses = [];
    //reset army removal (from raiding a tower level) tracker array
    this.armiesRemovedFrom = [];
    //reset feed
    this.feedMoves = [];
    this.update_feed();
  }
}

export const BossFightingPage = new BossFightingPageClass("BossFightingPage");