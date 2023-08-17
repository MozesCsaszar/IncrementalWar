/*

Created by: Császár Mózes (mozescsaszar@gmail.com)
Code use is only permitted for personal, non-commercial or non-commercial cases. Please don't
use or reuse part of the project in an application released to target audiences greater than
family or close circle of friends.

*/
import { GM } from "./variables";
import { getHtmlElement, stylizeDecimals } from "./functions";;

const goldText = getHtmlElement("#GoldText");

//click event for the continue from offline button
getHtmlElement("#ContinueFromOfflineProgress").addEventListener("click", () => {
  //change current page to be able to use HidePages
  const currentPage = localStorage.getItem("currentPage")!;
  getHtmlElement("#OfflinePageContainer").hidden = true;
  getHtmlElement("#PageButtonsContainer").hidden = false;
  goldText.parentElement!.hidden = false;
  //UNCOMMENT THIS
  GM.hidePages(currentPage);
});

//load the game on each session when starting up
window.addEventListener("load", () => {
  GM.openGame();
});
//save game whenever you switch tabs in browser (close, refresh, go to new/other tab)
// document.addEventListener('visibilitychange', function() {
//     if (document.visibilityState === 'visible') {
//         let a = Number(localStorage.getItem('currentPage'));
//         LoadOfflineProgress(Date.now() - Number(localStorage.getItem('lastSavedTime')), a);
//         save_interval = setInterval(SaveToLocalStorage,1000);
//     } else {
//         if(localStorage.length != 0) {
//             SaveToLocalStorage();
//         }

//         clearInterval(save_interval);
//     }
// });
//save the game before closing
// window.addEventListener('beforeunload', () => {CloseGame()});

function tick() {
  goldText.innerHTML = stylizeDecimals(GM.Player.gold);
  for (let i = 0; i < GM.TowerPage.Tower.raidedLevels.length; i++) {
    GM.TowerPage.Tower.floors[GM.TowerPage.Tower.raidedLevels[i][0]].levels[GM.TowerPage.Tower.raidedLevels[i][1]].tick(20);
  }
}

setInterval(tick, 50);
