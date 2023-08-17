import { PageClass } from "./base_classes";

class TowerSelectArmyButtonsClass extends ButtonGroupClass {
  constructor(containerIdentifier, buttonIdentifier, selectedStyle, defaultStyle) {
    super(containerIdentifier, buttonIdentifier, selectedStyle, defaultStyle);
  }

  buttonClick(buttonNr) {
    super.buttonClick(buttonNr);
    TowerPage.changeArmy(buttonNr);
  }
}

class TowerPageClass extends PageClass {
  Tower: any;
  constructor(name) {
    super(name);

    this.towerFloors = Array.from(document.querySelectorAll(".tower_part").values());
    //reverse tower floors
    let i = 0;
    let j = this.towerFloors.length;
    while (i < j) {
      [this.towerFloors[i], this.towerFloors[j]] = [this.towerFloors[j], this.towerFloors[i]];
      i++;
      j--;
    }
    //remove undefined element from start
    this.towerFloors.shift();
    this.towerLevels = document.querySelectorAll(".tower_level");
    this.towerInfo = document.getElementById("TowerPageTowerInfo");
    this.pageButton = document.getElementById("TowerPageButton");
    this.changeArmyButtons = new TowerSelectArmyButtonsClass(".toggle_button_container.page_tower", ".toggle_button", { "borderColor": "var(--selected-toggle-button-border-color)" }, { "borderColor": "var(--default-toggle-button-border-color)" });
    this.currentArmy = 0;
    this.armyInfo = document.getElementById("TowerPageArmyInfo");
    this.Tower = new TowerClass();

    this.initializeEventListeners();
  }
  //called when page reloads
  initializeEventListeners() {
    const this = this;

    //initialize TOWER FLOOR hover functions
    for (let i = 0; i < this.towerFloors.length; i++) {
      //floors that are not yet implemented have their stuff here (mouseenter)
      if (i >= this.Tower.floors.length) {
        //set cursor style for floors that are not implemented yet.
        this.towerFloors[i].style.cursor = "default";
        this.towerFloors[i].addEventListener("mouseenter", () => {
          this.towerInfo.innerHTML = "Under developement, sorry. :<)";
        });
      }
      //implemented floors have mouseenter and click here
      else {
        //on mouseenter display new floor
        this.towerFloors[i].addEventListener("mouseenter", () => {
          this.displayFloor(i);
          //if the current floor is not selected
          if (i != this.Tower.currentFloor) {
            this.towerFloors[i].style.backgroundColor = "var(--hover-tower-floor-background-color)";
          }
          else {
            this.towerFloors[i].style.backgroundColor = "var(--hover-selected-tower-floor-background-color)";
          }
        });
        //on click change color and currentFloor
        this.towerFloors[i].addEventListener("click", () => {
          this.towerFloors[this.Tower.currentFloor].style.background = "var(--default-tower-floor-background-color)";
          this.Tower.currentFloor = i;
          this.towerFloors[i].style.background = "var(--selected-tower-floor-background-color)";
        });
      }
      //on mouseleave, revert to current floor
      this.towerFloors[i].addEventListener("mouseleave", () => {
        this.displayFloor(this.Tower.currentFloor);
        if (i != this.Tower.currentFloor) {
          this.towerFloors[i].style.backgroundColor = "var(--default-tower-floor-background-color)";
        }
        else {
          this.towerFloors[i].style.backgroundColor = "var(--selected-tower-floor-background-color)";
        }

      });

    }

    //TOWER LEVEL click, enter and leave events and new atribute
    for (let i = 0; i < this.towerLevels.length; i++) {
      //display new level stuff on mouseenter
      this.towerLevels[i].addEventListener("mouseenter", () => {
        this.displayLevelText(this.Tower.currentFloor, i);
      });
      //on mouseleave, display current floor
      this.towerLevels[i].addEventListener("mouseleave", () => {
        this.displayFloorText();
      });
      //on click, change army that is raiding it
      this.towerLevels[i].addEventListener("click", () => {
        const level = this.Tower.floors[this.Tower.currentFloor].levels[i];
        const last_one = level.raid(i);
        //if raid was successfull, then change appearances around
        if (!(last_one === false)) {
          //if there was a last one that this army raided, then remove visuals from that army
          if (last_one != -1) {
            this.displayLevel(this.Tower.currentFloor, last_one);
          }
          this.displayLevel(this.Tower.currentFloor, i);
          this.displayLevelText(this.Tower.currentFloor, i);
        }
      });
      this.towerLevels[i].setAttribute("contenttext", "");
    }
  }
  //called when new save gets loaded
  displayOnLoad() {
    this.towerFloors[this.Tower.currentFloor].style.backgroundColor = "var(--selected-tower-floor-background-color)";
    //set the context text to the value you need on levels raided
    for (let i = 0; i < this.Tower.raidedLevels.length; i++) {
      const path = this.Tower.raidedLevels[i];
      this.towerLevels[path[1]].setAttribute("contenttext", this.Tower.floors[path[0]].levels[path[1]].raiding_army + 1);
    }
  }
  display() {
    this.changeArmy(this.currentArmy);
    this.displayFloor(this.Tower.currentFloor);
    if (this.timesVisited == 0) {
      TutorialPage.unlockTutorial("Tower Page");
      TutorialPage.startTutorial("Tower Page", true, "TowerPage");
    }
    this.timesVisited++;
  }
  displayEveryTick(this) { }
  //called when a save text is needed
  save() {
    let saveText = super.save();

    saveText += "/*/" + this.currentArmy + "/*/";
    //save raided floors and raided levels
    saveText += this.Tower.save();

    saveText += "/*/" + this.changeArmyButtons.save();

    return saveText;
  }
  //called when you need to get values from a saveText
  load(saveText) {
    saveText = saveText.split("/*/");
    let i = super.load(saveText);
    this.currentArmy = Number(saveText[i]); i++;
    i = this.Tower.load(saveText, i);
    i += this.changeArmyButtons.load(saveText, i);

    //display changes with on load function
    this.displayOnLoad();
  }
  changeArmy(changeTo) {
    this.currentArmy = changeTo;
    this.armyInfo.innerHTML = Player.armies[this.currentArmy].getText(true);
    this.displayFloor(this.Tower.currentFloor);
  }
  displayFloor(floor_nr) {
    //hide which is not needed, then show which is needed
    let j = this.Tower.floors[floor_nr].levels.length;
    while (j < this.towerLevels.length) {
      this.towerLevels[j].hidden = true;
      j++;
    }
    j = 0;
    while (j < this.Tower.floors[floor_nr].levels.length) {
      //only show if it is unlocked
      this.towerLevels[j].hidden = false;
      j++;
    }
    //color by availability and set position
    j = 0;
    while (j < this.Tower.floors[floor_nr].levels.length) {
      this.displayLevel(floor_nr, j);
      j++;
    }
    //display floor info
    this.displayFloorText();
  }
  displayFloorText() {
    this.towerInfo.innerHTML = this.Tower.floors[this.Tower.currentFloor].getText();
  }
  displayLevel(floor_nr, level_nr) {
    const level = this.Tower.floors[floor_nr].levels[level_nr];
    const content_text = level.raiding_army == -1 ? " " : string(level.raiding_army + 1);
    this.towerLevels[level_nr].setAttribute("contenttext", content_text);
    this.towerLevels[level_nr].innerHTML = content_text;
    this.towerLevels[level_nr].style.background = level.get_color();
    this.towerLevels[level_nr].style.width = level.width;
    this.towerLevels[level_nr].style.height = level.height;
    this.towerLevels[level_nr].style.top = level.top;
    this.towerLevels[level_nr].style.left = level.left;
    this.towerLevels[level_nr].style.zIndex = level.z_index;
  }
  displayLevelText(floor_nr, level_nr) {
    const level = this.Tower.floors[floor_nr].levels[level_nr];
    this.towerInfo.innerHTML = level.getText(this.Tower.floors[this.Tower.currentFloor].name, floor_nr, level_nr);
  }
}

export const TowerPage = new TowerPageClass("TowerPage");

