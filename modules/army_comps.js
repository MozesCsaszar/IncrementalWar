class ArmyComponent {
    constructor(name = 'None', desc = 'None', stats = new Stats(), body_parts = new Stats(), requires = new Stats(), type = 'Creature', price_handeler = new PriceHandler()) {
        this.name = name;
        this.desc = desc;
        this.stats = stats;
        this.requires = requires;
        this.type = type;
        this.price_handeler = price_handeler;
        this._body_parts = body_parts;
    }

    get body_parts() {
        return this._body_parts;
    }

    get_price(nr_owned, to_buy) {
        return this.price_handeler.get_price(nr_owned,to_buy);
    }

    get_compare_text(other) {
        return  'Name: ' + this.name + ' → ' + other.name + '<br>' +
        this.stats.get_compare_text(other.stats) + 
        (this.requires.isNull() ? '' : '<br>' + 'Requires:<br>'+this.requires.get_compare_text(other.requires));
    }

    get_full_text() {
        return '<b>Name: ' + this.name + '</b><br>' +
        this.stats.get_text() +
        '<br>' +
        (this._body_parts.isNull() ? '' : 'Parts:<br>'+this.body_parts.get_text()) +
        (this.requires.isNull() ? '' : 'Requires:<br>'+this.requires.get_text()) +
        '<br><i>' + this.desc + '</i>';
    }

    get_text() {
        return '<b>Name: ' + this.name + '</b><br>' +
        this.stats.get_text() +
        '<br>' +
        (this._body_parts.isNull() ? '' : 'Parts:<br>'+this.body_parts.get_text()) + '<br>' +
        (this.requires.isNull() ? '' : 'Requires:<br>'+this.requires.get_text()) +
        '<br><i>' + this.desc + '</i>';
    }
}


/*
class Creature extends ArmyComponent {
    constructor(name = 'None', desc = 'None', stats = new Stats(), requires = new Stats(), price_handeler = new PriceHandler()) {
        super(name, desc, stats, requires, price_handeler);
    }

    
}

class Weapon extends ArmyComponent {
    constructor(name = 'None', desc = 'None', stats = new Stats(['Attack'],[new SubStats()]), hands_needed = 0, price_handeler = new PriceHandler()) {
        this.name = name;
        this.desc = desc;
        this.stats = stats;
        this.hands_needed = hands_needed;
        this.price_handeler = price_handeler;
    }

    //placeholder function
    get_price(nr_owned, to_buy) {
        return this.price_handeler.get_price(nr_owned,to_buy);
    }

    get_compare_text(other) {
        return '<b>Name: ' + this.name + ' → ' + other.name + '</b><br>' +
        this.stats.get_text() + 
        'Hands needed: ' + this.hands_needed + ' → <span style="color:' + UtilityFunctions.get_compare_color(other.hands_needed, this.hands_needed, false) + ';">' + other.hands_needed + '</span><br>';

    }

    get_text() {
        return '<b>Name: ' + this.name + '</b><br>' +
        this.stats.get_text() +
        '<br>' +
        'Hands: ' + this.hands_needed + '<br>' +
        '<br><i>' + this.desc + '</i>';
        
    }
}
*/