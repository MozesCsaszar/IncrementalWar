class PageButtonsClass extends ButtonGroupClass {
    constructor(container_idetifier, button_identifier, selected_style, default_style) {
        super(container_idetifier, button_identifier, selected_style, default_style);
    }

    showButton(button_nr) {
        super.showButton(button_nr);
        this.buttons[button_nr].hidden = false;
    }
    hideButton(button_nr) {
        super.hideButton(button_nr);
        this.buttons[button_nr].hidden = true;
    }
    buttonClick(button_nr) {
        super.buttonClick(button_nr);
        HidePages(this.buttons[button_nr].getAttribute('page'));
    }
}

class GameBodyClass {
    constructor() {
        this.pageButtons = new PageButtonsClass('#AllPageButtons', '.page_button', {'borderColor': 'var(--selected-page-button-border-color)'}, {'borderColor': 'var(--default-page-button-border-color)'})
        this.resourceContainer = document.querySelector('#PageTopResourcesContainer');
    }
}

let GB = new GameBodyClass();