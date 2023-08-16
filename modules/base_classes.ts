//FIGHTING RELATED
//CHANGE THIS PLACEMENT
/*
    bosses - the names of the bosses from stuff which you need to fight
    max_selectible_armies - max number of armies the player can bring to the fight
    lose_soldiers - true if you lose soldiers based on the soldier_loss_ratio of the boss you are fighting
                    false if you don't lose soldiers no matter what
*/
class Fight {
    constructor(bosses=[], max_selectible_armies, lose_soldiers) {
        this.bosses = bosses;
        this.max_selectible_armies = max_selectible_armies;
        this.lose_soldiers = lose_soldiers;
        //initialize selected armies
        this.selected_armies = []
        for(let i = 0; i < max_selectible_armies; i++) {
            this.selected_armies.push(-1);
        }
    }
}

//A base Page class which has all the functions and values necessary for it to work
class PageClass {
    constructor(name) {
        this.name = name;
        this.container = document.getElementById(name + 'Container');
        this.timesVisited = 0;

        //call initializeEventListeners here
    }

    //functions to hide/show page by containers hidden value to make use easier
    get hidden() {
        return this.container.hidden;
    }
    set hidden(val) {
        this.container.hidden = val;
    }
    //called when page reloads
    initializeEventListeners() {}
    //called when new save gets loaded
    displayOnLoad() {}
    //called when page gets visible
    display() {}
    //call when displaying every tick; needs obj as self so that it can access stuff in itself
    displayEveryTick(obj) {}
    //called when a save text is needed
    save() {
        return String(this.timesVisited);
    }
    //called when you need to get values from a save_text
    //maybe should call displayOnLoad?
    //returns the number of steps taken
    load(save_text) {
        this.timesVisited = Number(save_text[0]);
        return 1;
    }
};

class ItemListClass {
    //container: the container object, list_identifier: the identifier by which you can find the list container, the rest will be handled automatically
    constructor(container_idetifier,element_idetifier, previous_button_identifier, back_button_identifier, next_button_identifier, item_list = []) {
        this.container = document.querySelector(container_idetifier);
        this.elements = document.querySelectorAll(container_idetifier + ' > ' + element_idetifier);
        //for hiding elements and defining if the element is hidden or not
        this.elementsVisible = [];
        for(let i = 0; i < this.elements.length; i++) {
            this.elementsVisible.push(true);
        }
        this.previousButton = document.querySelector(container_idetifier + ' > .element_list_buttons_container > ' + previous_button_identifier);
        this.backButton = document.querySelector(container_idetifier + ' > .element_list_buttons_container > ' + back_button_identifier);
        this.nextButton = document.querySelector(container_idetifier + ' > .element_list_buttons_container > ' + next_button_identifier);
        this.buttonsVisible = [true, true, true];

        this.itemList = item_list;
        this.page = 0;

        this.initializeEventListeners();
    }

    get hidden() {
        return this.container.hidden;
    }

    initializeEventListeners() {
        let obj = this;

        //item mouse functions (basically call ItemListClass functions for elements that are visible)
        for(let i = 0; i < this.elements.length; i++) {
            this.elements[i].addEventListener('mouseenter', function() {
                if(obj.elementsVisible[i]) {
                    obj.elementMouseenter(i);
                }
            });
            this.elements[i].addEventListener('mouseleave', function() {
                if(obj.elementsVisible[i]) {
                    obj.elementMouseleave(i);
                }
            });
            this.elements[i].addEventListener('click', function() {
                if(obj.elementsVisible[i]) {
                    obj.elementClick(i);
                }
            });
        }
        this.previousButton.addEventListener('click', function() {
            if(obj.buttonsVisible[0]) {
                obj.previousButtonClick();
            }
        });
        this.backButton.addEventListener('mouseenter', function() {
            if(obj.buttonsVisible[1]) {
                obj.backButtonMouseenter();
            }
        });
        this.backButton.addEventListener('mouseleave', function() {
            if(obj.buttonsVisible[1]) {
                obj.backButtonMouseleave();
            }
        });
        this.backButton.addEventListener('click', function() {
            if(obj.buttonsVisible[1]) {
                obj.backButtonClick();
            }
        });
        this.nextButton.addEventListener('click', function() {
            if(obj.buttonsVisible[2]) {
                obj.nextButtonClick();
            }
        });
    }
    //calculates and returns the item's list index based on the current element and the current page
    getItemListIndex(elem_nr) {
        return this.page * this.elements.length + elem_nr;
    }
    changeItemList(item_list) {
        this.itemList = item_list;
    }
    changePage(pageNr) {
        this.page = pageNr;
        for(let i = 0; i < this.elements.length; i++) {
            //if index is alright, populate and display element
            if(this.getItemListIndex(i) < this.itemList.length) {
                this.populateElement(i);
                this.showElement(i);
            }
            //else hide it
            else {
                this.hideElement(i);
            }
        }
        this.showHidePreviousNextButton();
    }
    //reset the list to page 0 and show it again
    reset() {
        this.page = 0;
        this.changePage(0);
    }
    //show and hide list
    show(do_reset) {
        if(do_reset) {
            this.reset();
        }
        this.container.hidden = false;
    }
    hide() {
        this.container.hidden = true;
    }
    //mouse events for individual elements on the list
    elementMouseenter(elem_nr) {}
    elementMouseleave(elem_nr) {}
    elementClick(elem_nr) {}
    //show/hide an element (can be done by using hidden, just disabling border and innerHTML = '' or anything else)
    showElement(elem_nr) {
        this.elementsVisible[elem_nr] = true;
        this.elements[elem_nr].style.cursor = 'pointer';
    }
    hideElement(elem_nr) {
        this.elementsVisible[elem_nr] = false;
        this.elements[elem_nr].style.cursor = 'default';
    }
    //populate an element with data
    populateElement(elem_nr) {}
    //back button events
    backButtonMouseenter() {}
    backButtonMouseleave() {}
    hideBackButton() {
        this.buttonsVisible[1] = false;
    }
    showBackButton() {
        this.buttonsVisible[1] = true;
    }
    backButtonClick() {
        //just hide the back button
        this.hide();
    }
    //previous and next item list page button click event
    hidePreviousButton() {
        this.previousButton.style.cursor = 'default';
        this.buttonsVisible[0] = false;
    }
    showPreviousButton() {
        this.previousButton.style.cursor = 'pointer';
        this.buttonsVisible[0] = true;
    }
    previousButtonClick() {
        if(this.page > 0) {
            this.changePage(this.page - 1);
        }
        this.showHidePreviousNextButton();
    }
    hideNextButton() {
        this.nextButton.style.cursor = 'default';
        this.buttonsVisible[2] = false;
    }
    showNextButton() {
        this.nextButton.style.cursor = 'pointer';
        this.buttonsVisible[0] = true;
    }
    nextButtonClick() {
        if( (this.page + 1) * this.elements.length < this.itemList.length) {
            this.changePage(this.page + 1);
        }
        this.showHidePreviousNextButton();
    }
    //handle hidden/visible states for previous and next button
    showHidePreviousNextButton() {
        //show previous button if there is a page to go back
        if(this.page > 0) {
            this.showPreviousButton();
        }
        //else hide previous button
        else {
            this.hidePreviousButton();
        }
        //show next page button if there is a page to go forwards to
        if( (this.page + 1) * this.elements.length < this.itemList.length) {
            this.showNextButton();
        }
        //else just hide it
        else {
            this.hideNextButton();
        }

    }
};

//style is an object with keys naming the style object(like borderColor, width etc.) and value is the value it needs to be substituted with
class ButtonGroupClass {
    constructor(container_idetifier, button_identifier, selected_style, default_style) {
        this.container = document.querySelector(container_idetifier);
        this.buttons = document.querySelectorAll(container_idetifier + ' > ' + button_identifier);

        this.selected = 0;
        this.buttonsVisible = [];
        for(let i = 0; i < this.buttons.length; i++) {
            this.buttonsVisible.push(true);
        }

        this.selectedStyle = selected_style;
        this.defaultStyle = default_style;

        this.initializeEventListeners();
    }

    get hidden() {
        return this.container.hidden;
    }
    set hidden(val) {
        this.container.hidden = val;
    }

    initializeEventListeners() {
        let obj = this;

        //button mouse events
        for(let i = 0; i < this.buttons.length; i++) {
            this.buttons[i].addEventListener('mouseenter', function() {
                if(obj.buttonsVisible[i]) {
                    obj.buttonMouseenter(i);
                }
            });
            this.buttons[i].addEventListener('mouseleave', function() {
                if(obj.buttonsVisible[i]) {
                    obj.buttonMouseleave(i);
                }
            });
            this.buttons[i].addEventListener('click', function() {
                if(obj.buttonsVisible[i]) {
                    obj.buttonClick(i);
                }
            });
        }
    }

    buttonMouseenter(button_nr) {}
    buttonMouseleave(button_nr) {}
    selectButton(button_nr) {
        for(let [key, value] of Object.entries(this.selectedStyle)) {
            this.buttons[button_nr].style[key] = value;
        }
        this.selected = button_nr;
    }

    buttonClick(button_nr) {
        if(button_nr != this.selected) {
            //restore previously selected to default appearance
            for(let [key, value] of Object.entries(this.defaultStyle)) {
                this.buttons[this.selected].style[key] = value;
            }
            //change newly selected to selected appearance
            this.selectButton(button_nr);
        }
    }
    showButton(button_nr) {
        this.buttonsVisible[button_nr] = true;
    }
    hideButton(button_nr) {
        this.buttonsVisible[button_nr] = false;
    }

    //returns save text in which the state of the buttons was saved
    save() {
        let save_text = String(this.selected);

        return save_text;
    }
    //will load itself from save_text, starting at index i
    //returns number of steps taken (fields used) in save_text
    load(save_text, i) {
        this.selected = Number(save_text[i]) == 0 ? 1 : 0;
        this.buttonClick(Number(save_text[i]));
        return 1;
    }

    //functions to show/hide the button group
    show() {
        this.container.hidden = false;
    }
    hide() {
        this.container.hidden = true;
    }
}