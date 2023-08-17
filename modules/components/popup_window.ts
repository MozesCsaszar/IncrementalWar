//A popup window for your inspection needs
export const PopupWindow = {
  container: $("#PopupWindowContainer").get(0)!,
  left: -1000,
  top: -1000,
  show(left: number, top: number, content: string) {
    PopupWindow.container.hidden = false;
    PopupWindow.container.innerHTML = content;
    PopupWindow.move(left, top);
  },
  move(left: number, top: number) {
    PopupWindow.container.style.left = left + "5";
    PopupWindow.container.style.top = top + "5";
    PopupWindow.left = left;
    PopupWindow.top = top;
  },
  hide() {
    PopupWindow.container.hidden = true;
  },
};