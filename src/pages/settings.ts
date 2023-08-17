import { PlayerClass, GameManagerClass } from "../base_classes";
import { PageClass } from "../base_classes";
import { getHtmlElement } from "../functions";
import { GB } from "../game_body";
import { StringHashT } from "../types";
import { allThingsStatistics } from "../statistics";
import { UH } from "../unlocks";

const downloadToFile = (content: string, filename = 'GameSave', contentType = 'text/plain') => {
  const a = document.createElement('a');
  const file = new Blob([content], { type: contentType });

  a.href = URL.createObjectURL(file);
  a.download = filename;
  a.click();

  URL.revokeObjectURL(a.href);
};


export class SettingsPageClass extends PageClass {
  pageButton: HTMLElement = getHtmlElement('#SettingsPageButton');
  saveGameButton: HTMLElement = getHtmlElement('#SaveGameButton');
  loadGameButton: HTMLInputElement = getHtmlElement('#LoadGameButton') as HTMLInputElement;
  changeThemeButton: HTMLElement = getHtmlElement('#ChangeTheme');
  colorThemes: StringHashT<[string, string][]>;
  themeOrder: string[];
  currentTheme: number;
  tutorialButton: any;
  constructor(name: string, gM: GameManagerClass) {
    super(name, gM);
    this.pageButton;
    this.saveGameButton;
    this.loadGameButton;
    this.changeThemeButton;
    this.colorThemes = {
      'Black Theme': [
        ['--default-background-color', 'rgb(14, 14, 15)'],
        ['--default-color', 'rgb(240, 248, 255)'],
        ['--default-toggle-button-border-color', 'rgb(255, 69, 0)'],
        ['--selected-toggle-button-border-color', 'rgb(64, 00, 255)'],
        ['--default-button-border-color', 'rgb(69,192,0)'],
        ['--default-tower-floor-background-color', 'rgb(255, 255, 0)'],
        ['--hover-tower-floor-background-color', 'rgb(214, 188, 40)'],
        ['--selected-tower-floor-background-color', 'rgb(194, 146, 24)'],
        ['--hover-selected-tower-floor-background-color', 'rgb(156, 116, 13)'],
        ['--default-tower-floor-color', 'rgb(0, 0, 0)'],
        ['--default-tower-floor-border-color', 'rgb(0, 0, 0)'],
        ['--default-tower-level-background-color', 'rgb(222, 184, 135)'],
        ['--disabled-tower-level-background-color', 'rgb(70, 66, 61)'],
        ['--default-selection-list-border-color', 'rgb(128, 0, 128)'],
      ],
      'Grey Theme': [
        ['--default-background-color', 'rgb(60, 60, 67)'],
        ['--default-color', 'rgb(255, 255, 255)'],
        ['--default-toggle-button-border-color', 'rgb(255, 55, 20)'],
        ['--selected-toggle-button-border-color', 'rgb(53, 101, 202)'],
        ['--default-button-border-color', 'rgb(102, 185, 53)'],
        ['--default-tower-floor-background-color', 'rgb(218, 218, 37)'],
        ['--hover-tower-floor-background-color', 'rgb(214, 188, 40)'],
        ['--selected-tower-floor-background-color', 'rgb(194, 146, 24)'],
        ['--hover-selected-tower-floor-background-color', 'rgb(156, 116, 13)'],
        ['--default-tower-floor-color', 'rgb(0, 0, 0)'],
        ['--default-tower-floor-border-color', 'rgb(24, 23, 32)'],
        ['--default-tower-level-background-color', 'rgb(199, 156, 99)'],
        ['--disabled-tower-level-background-color', 'rgb(54, 52, 49)'],
        ['--default-selection-list-border-color', 'rgb(112, 5, 112)'],
      ],
      'Dark Red Theme': [
        ['--default-background-color', 'rgb(35, 7, 9)'],
        ['--default-color', 'rgb(168, 127, 52)'],
        ['--default-toggle-button-border-color', 'rgb(252, 25, 25)'],
        ['--selected-toggle-button-border-color', 'rgb(145, 76, 45)'],
        ['--default-button-border-color', 'rgb(252, 25, 25)'],
        ['--default-tower-floor-background-color', 'rgb(146, 0, 0)'],
        ['--hover-tower-floor-background-color', 'rgb(110, 0, 0)'],
        ['--selected-tower-floor-background-color', 'rgb(90, 9, 9)'],
        ['--hover-selected-tower-floor-background-color', 'rgb(73, 9, 9)'],
        ['--default-tower-floor-color', 'rgb(39, 1, 1)'],
        ['--default-tower-floor-border-color', 'rgb(41, 0, 0)'],
        ['--default-tower-level-background-color', 'rgb(184, 21, 62)'],
        ['--disabled-tower-level-background-color', 'rgb(73, 27, 27)'],
        ['--default-selection-list-border-color', 'rgb(128, 0, 128)'],
      ],
    };
    this.themeOrder = ['Black Theme', 'Dark Red Theme'];
    this.currentTheme = -1;
    this.tutorialButton = document.querySelector('#SettingsPageTutorialButton');

    this.initializeEventListeners();
  }

  initializeEventListeners() {
    //Theme button
    this.changeThemeButton.addEventListener('click', () => {
      this.changeTheme();
    });

    //Save your game to file
    this.saveGameButton.addEventListener('click', () => {
      let saveText = this.gM.Player.save();
      saveText += '*/*' + allThingsStatistics.save();
      saveText += '*/*' + UH.save();
      for (let page of Object.values(this.gM.pages)) {
        saveText += '*/*' + page.save();
      }
      saveText += '*/*' + this.gM.currentPage;
      saveText += '*/*' + Date.now();
      downloadToFile(saveText);
    });

    //Load in your game from file
    this.loadGameButton.addEventListener('input', () => {
      this.gM.canSave = false;
      if (this.loadGameButton.files) {
        let fileReader = new FileReader();
        fileReader.onload = () => {
          let saveText = fileReader.result as string;
          const saveTextArr = saveText.split('*/*');
          let i = 0;
          this.gM.Player.load(saveTextArr[i]); i++;
          allThingsStatistics.load(saveTextArr[i]); i++;
          UH.load(saveTextArr[i]); i++;
          for (let page of Object.values(this.gM.pages)) {
            page.load(saveTextArr[i]); i++;
          }
          this.gM.hidePages(saveTextArr[i]); i++;
          this.gM.loadOfflineProgress(Date.now() - Number(saveTextArr[i])); i++;

        };
        fileReader.readAsText(this.loadGameButton.files[0]);
      }
      this.gM.canSave = true;
    });

    //tutorial button
    this.tutorialButton.addEventListener('click', () => {
      this.gM.TutorialPage.startTutorial('None', false, 'SettingsPage');
      this.gM.hidePages('TutorialPage');
    });

    //reset button
    getHtmlElement('#ResetButton').addEventListener('click', () => {
      this.gM.canSave = false;

      localStorage.clear();
      location.reload();
    });
  }
  changeTheme() {
    this.currentTheme++;
    if (this.currentTheme == this.themeOrder.length) {
      this.currentTheme = 0;
    }
    this.changeThemeButton.innerHTML = this.themeOrder[this.currentTheme];
    for (let j = 0; j < this.colorThemes[this.themeOrder[this.currentTheme]].length; j++) {
      document.body.style.setProperty(...this.colorThemes[this.themeOrder[this.currentTheme]][j]);
    }
  }
  displayOnLoad() {
    this.changeTheme();
  }
  display() {
    if (this.timesVisited == 0) {
      this.gM.TutorialPage.startTutorial('Settings Page', true, 'SettingsPage');
    }
    else if (this.timesVisited == 1) {
      //CHANGE/SOLVE THIS
      GB.pageButtons.container.parentElement.hidden = false;
    }
    this.timesVisited++;
  }
  displayEveryTick() { }
  save() {
    let saveText = super.save() + '/*/';
    saveText += String(this.currentTheme - 1);
    return saveText;
  }
  load(saveText: string) {
    const saveTextArr = saveText.split('/*/');
    //load base page and start counting from there in save file
    let loadI = super.load(saveTextArr);
    let i = loadI ? loadI : 0;
    this.currentTheme = Number(saveTextArr[i]) <= -1 ? -1 : Number(saveTextArr[i]);
    this.changeTheme();
    return i;
  }
};