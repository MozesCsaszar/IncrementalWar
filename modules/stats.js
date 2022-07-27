//a class to handle price, created to accept multiple functions across multiple intervals
class PriceHandler {
    //ar = arithmetic increas, ge = geometric increase
    constructor(stop_points = [], types = ['ar'], coefficients = [new Decimal(0)], start_price = new Decimal(0)) {
        this.stop_points = stop_points;
        this.stop_points.unshift(new Decimal(0));
        this.stop_points.push(new Decimal(Infinity));
        this.coefficients = coefficients;
        this.coefficients.unshift(start_price);
        this.types = types;
        this.types.unshift('ar');
        this.stop_point_values = [coefficients[0]];
        for(let i = 1; i < stop_points.length; i++) {
            if(types[i] == 'ar') {
                this.stop_point_values[i] = this.stop_point_values[i-1].add( this.stop_points[i].sub(this.stop_points[i-1]).mul(this.coefficients[i]) );
            }
            else if(types[i] == 'ge') {
                this.stop_point_values[i] = this.stop_point_values[i-1].mul(this.stop_points[i].sub(this.stop_points[i-1]).pow(this.coefficients[i]));
            }
        }
    }

    get_price(nr_owned, to_buy) {
        let i = 0;
        while(this.stop_points[i].lte(nr_owned)) {
            i++;
        }
        //get start price
        let start_price = this.stop_point_values[i-1];
        let new_price = new Decimal(0);
        //calculate new price
        while(to_buy.gt(new Decimal(0))) {
            let upper_border = nr_owned.add(to_buy).gt(this.stop_points[i]) ? this.stop_points[i].sub(nr_owned) : to_buy;
            if(this.types[i] == 'ar') {
                new_price = new_price.add( Decimal.sumArithmeticSeries(upper_border, start_price, this.coefficients[i], nr_owned.sub(this.stop_points[i-1])) );
            }
            else if(this.types[i] == 'ge') {
                new_price = new_price.add( Decimal.sumGeometricSeries(upper_border, start_price, this.coefficients[i], nr_owned.sub(this.stop_points[i-1])) );
            }
            start_price = this.stop_point_values[i];
            i++;
            to_buy = to_buy.sub(upper_border);
            nr_owned = nr_owned.add(upper_border);
        }
        return new_price;
    }
}

//elemental circle: fire -> nature -> water -> earth -> fire

/*
    A class which handles substats, containing values for physical, magic, fire, water, earth and nature.
    Public variables contain useable strings for creating string representation
*/

class SubStats {
    static text_start = '<span style="color:';
    static type_color = {'physical' : 'black">', 'magic' : 'purple">', 'fire' : 'red">', 'water' : 'blue">', 'earth' : 'brown">', 'nature' : 'green">'}
    static type_end= {'physical' : '⬟</span>', 'magic' : '⬣</span>', 'fire' : '■</span>', 'water' :  '■</span>', 'earth' :  '■</span>', 'nature' :  '■</span>'}

    /*
        Create a new SubStats object from decimal values.
    */
    constructor(physical = new Decimal(0), magic = new Decimal(0), fire = new Decimal(0), water = new Decimal(0), earth = new Decimal(0), nature = new Decimal(0)) {
        this.physical = physical;
        this.magic = magic;
        this.fire = fire;
        this.water = water;
        this.earth = earth;
        this.nature = nature;
    }

    get type() {
        return 'SubStats'
    }
    

    eq(other) {
        if(other.type == 'SubStats') {
            for(let ss in this) {
                if(!this[ss].eq(other[ss])) {
                    return false;
                }
            }
            return true;
        }
        else {
            for(let ss in this) {
                if(!this[ss].eq(other)) {
                    return false;
                }
            }
            return true;
        }
    }

    lt(other) {
        if(other.type == 'SubStats') {
            for(let ss in other) {
                if(! this[ss].lt(other[ss])) {
                    return false;
                }
            }
            return true;
        }
        else {
            for(let ss in this) {
                if(!this[ss].lt(other)) {
                    return false;
                }
            }
            return true;
        }
    }

    //Maybe optimize?
    lte(other) {
        if(other.type == 'SubStats') {
            for(let ss in other) {
                if(! this[ss].lte(other[ss])) {
                    return false;
                }
            }
            return true;
        }
        else {
            for(let ss in this) {
                if(!this[ss].lte(other)) {
                    return false;
                }
            }
            return true;
        }
    }

    gt(other) {
        return !this.lte(other);
    }

    gte(other) {
        return !this.lt(other);
    }

    /*
        Add a substat object to the current one, returning the resulting substat.
    */
    add(other) {
        var a = new SubStats();
        for(let e in a) {
            a[e] = this[e].add(other[e]);
        }
        return a;
    }

    /*
        Substract a substat object from the current one, returning the resulting substat.
    */
    sub(other) {
        var a = new SubStats();
        for(let e in a) {
            a[e] = this[e].sub(other[e]);
        }
        return a;
    }

    /*
        Multiply a substat object by the current one, returning the resulting substat.
        Multiply a substat by a Decimal() number, returning a new substats object with the result.
    */
    mul(other) {
        var a = new SubStats();
        //if it is a SubStat that you are multiplying by, take if by elements
        if(other.isNull) {
            for(let e in a) {
                a[e] = this[e].mul(other[e]);
            }
        }
        else {
            for(let e in a) {
                a[e] = this[e].mul(other);
            }
        }
        return a;
    }

    /*
        Divide the current substats by another one, returning the resulting substat.
        Divide the current substats by a Decimal() number, returning a new substats object with the result.
    */
    div(other) {
        var a = new SubStats();
        if(other.isNull) {
            for(let e in a) {
                if(other[e] != 0) {
                    a[e] = this[e].div(other[e]);
                }
            }
        }
        else {
            if(other[e] != 0) {
                for(let e in a) {
                    a[e] = this[e].div(other);
                }
            }
        }
        
        return a;
    }

    isNull() {
        for(let e in this) {
            if(this[e] != 0) {
                return false;
            }
        }
        return true;
    }

    /*
        Return a string (HTML) representation of the substrats object.
    */
    get_text() {
        let t = '';
        if(this.isNull()) {
            return '0';
        }
        for(let e in this) {
            if(this[e] != 0) {
                t += SubStats.text_start + SubStats.type_color[e] + StylizeDecimals(this[e]) + SubStats.type_end[e] + '&nbsp';
            }
        }
        return t;
    }

    //get the elemental attributly unmodified power of attack or defense
    get_plain_power() {
        let pow = new Decimal(0);
        for(let e in this) {
            pow = pow.add(this[e]);
        }
        return pow;
    }
}

/*
    A class to store data related to stats.
    Uses SubStats for complex (or multi-variable stats) like attack and defense.
    Supports only entries which have eq, mul, add, sub and div methods
*/
class Stats {
    //stat names: Attack, Defense (substats), Health (not implemented yet)
    constructor(stat_names = [], stat_substats = []) {
        for(let i = 0; i < stat_names.length; i++) {
            this[stat_names[i]] = stat_substats[i];
        }
    }

    get type() {
        return 'Stats'
    }

    eq(other) {
        if(other.type == 'Stats') {
            for(let ss in this) {
                if(other[ss] != undefined && !this[ss].eq(other[ss])) {
                    return false;
                }
            }
            return true;
        }
        else if(other.type == 'SubStats') {
            return false;
        }
        else {
            for(let ss in this) {
                if(!this[ss].eq(other)) {
                    return false;
                }
            }
            return true;
        }
    }

    lt(other) {
        if(other.type == 'Stats') {
            for(let ss in other) {
                if(this[ss] != undefined && !this[ss].lt(other[ss])) {
                    return false;
                }
            }
            return true;
        }
        else if(other.type == 'SubStats') {
            return false;
        }
        else {
            for(let ss in this) {
                if(!this[ss].lt(other)) {
                    return false;
                }
            }
            return true;
        }
    }

    //Maybe optimize?
    lte(other) {
        if(other.type == 'Stats') {
            for(let ss in other) {
                if(this[ss] != undefined && !this[ss].lte(other[ss])) {
                    return false;
                }
            }
            return true;
        }
        else if(other.type == 'SubStats') {
            return false;
        }
        else {
            for(let ss in this) {
                if(!this[ss].lte(other)) {
                    return false;
                }
            }
            return true;
        }
    }

    gt(other) {
        if(other.type == 'SubStats') {
            return false;
        }
        else {
            return !this.lte(other);
        }
        
    }

    gte(other) {
        if(other.type == 'SubStats') {
            return false;
        }
        else {
            return !this.lt(other);
        }
    }

    isNull() {
        return this.eq(new Decimal(0));
    }

    /*
     A function to add a Stats object to Stats, Decimal or number object. Returns a new object, the old remaining unchanged.
     Input: other - another Stats object
    Output: the object which is the result of addition
    */
    add(other) {
        let a = new Stats([],[]);
        if(other.type == 'Stats') {
            for(let ss in other) {
                if(this[ss] == undefined) {
                    if(other[ss].type == 'Stats') {
                        a[ss] = other[ss].add(new Stats());
                    }
                    else if(other[ss].type == 'SubStats') {
                        a[ss] = other[ss].add(new SubStats());
                    }
                    else {
                        a[ss] = new Decimal(other[ss]);
                    }
                }
                else {
                    a[ss] = this[ss].add(other[ss]);
                }
            }
            for(let ss in this) {
                if(other[ss] == undefined) {
                    if(this[ss].type == 'Stats') {
                        a[ss] = this[ss].add(new Stats());
                    }
                    else if(this[ss].type == 'SubStats') {
                        a[ss] = this[ss].add(new SubStats());
                    }
                    else {
                        a[ss] = new Decimal(this[ss]);
                    }
                }
            }
        }
        else if(other.type == 'SubStats') {
            return a;
        }
        else {
            for(let ss in this) {
                this[ss].add(other);
            }
        }
        return a;
    }

    sub(other) {
        let a = new Stats([],[]);
        if(other.type == 'Stats') {
            for(let ss in other) {
                if(this[ss] == undefined) {
                    if(other[ss].type == 'Stats') {
                        a[ss] = other[ss].mul(new Decimal(-1));
                    }
                    else if(other[ss].type == 'SubStats') {
                        a[ss] = other[ss].mul(new Decimal(-1));
                    }
                    else {
                        a[ss] = new Decimal(other[ss].mul(-1));
                    }
    
                }
                else {
                    a[ss] = this[ss].sub(other[ss]);
                }
            }
            for(let ss in this) {
                if(other[ss] == undefined) {
                    if(this[ss].type == 'Stats') {
                        a[ss] = this[ss].mul(new Decimal(1));
                    }
                    else if(this[ss].type == 'SubStats') {
                        a[ss] = this[ss].mul(new Decimal(1));
                    }
                    else {
                        a[ss] = new Decimal(this[ss].mul(1));
                    }
                }
            }
        }
        else if(other.type == 'SubStats') {
            return a;
        }
        else {
            for(let ss in this) {
                this[ss].sub(other);
            }
        }
        return a;
    }

    mul(other) {
        let a = new Stats([],[]);
        //multiplying by another stat
        if(other.type == 'Stats') {
            for(let ss in other) {
                if(this[ss] != undefined) {
                    a[ss] = this[ss].mul(other[ss]);
                }
            }
        }
        //multiplying by a number or decimal
        else {
            for(let ss in this) {
                a[ss] = this[ss].mul(other);
            }
        }
        return a;
    }

    div(other) {
        let a = new Stats();
        if(! other.eq(0)) {
            //dividing by another stat
            if(other.type == 'Stats') {
                for(let ss in other) {
                    if(this[ss] != undefined) {
                        if(! other[ss].eq(0)) {
                            a[ss] = this[ss].div(other[ss]);
                        }
                    }
                }
            }
            //dividing by a number or decimal
            else {
                for(let ss in this) {
                    a[ss] = this[ss].mul(other);
                }
            }
        }
        return a;
    }

    /*
        Get the string(HTML) representation of the thing with a newline at the end.
    */
    get_text(show_zeros = false) {
        let t = '';
        for(let ss in this) {
            if(this[ss].type == 'Stats') {
                t += '<br>' + this[ss].get_text() + '<br>';
            }
            else if(this[ss].type == 'SubStats') {
                if(!this[ss].isNull() || show_zeros) {
                    t += ss + ':&nbsp' + this[ss].get_text() + '<br>';
                }
            }
            else {
                if(this[ss] != 0 || show_zeros) {
                    t += ss + ':&nbsp' + StylizeDecimals(this[ss]) + '<br>';
                }
            }
        }
        return t;
    }

    /*
        Get HTML string which represents the result of the comparison to current object.
    */
    get_compare_text(other) {
        let a = this.add(other);
        let t = '';
        for(let ss in a) {
            //if entry is not present in current stats
            if(this[ss] == undefined) {
                if(other[ss].type == 'Stats') {
                    t += '<br>' + other[ss].get_compare_text(new Stats());
                }
                else  {
                    t += ss + ':&nbsp';
                    if(other[ss].type == 'SubStats') {
                        t += '0 → ' + other[ss].get_text();
                    }
                    else {
                        t += '0 → ' + StylizeDecimals(other[ss]);
                    }
                }
            }
            //if entry is not present in the other stats
            else if(other[ss] == undefined) {
                if(this[ss].type == 'Stats') {
                    t += '<br>' + this[ss].get_compare_text(new Stats());
                }
                else {
                    t += ss + ':&nbsp';
                    if(this[ss].type == 'SubStats') {
                        t += this[ss].get_text() + ' → ';
                    }
                    else {
                        t += StylizeDecimals(this[ss]) + ' → 0';
                    }
                }
                
            }
            //if entry is present in both stats
            else {
                if(other[ss].type == 'Stats') {
                    t += '<br>' + this[ss].get_compare_text(other[ss]);
                }
                else {
                    t += ss + ':&nbsp';
                    if(other[ss].type == 'SubStats') {
                        t += this[ss].get_text() + ' → ' + other[ss].get_text();
                    }
                    else {
                        t += StylizeDecimals(this[ss]) + ' → ' + StylizeDecimals(other[ss]);
                    }
                }
                
            }
            t += '<br>';
        }
        return t;
    }

    //get the elemental attributly unmodified power of attack or defense
    get_plain_power(type = 'Attack||Defense') {
        if(this[type]) {
            return this[type].get_plain_power();
        }
        return new Decimal(0);
    }

    //get the elemental attributly modified power of attack or defense
    get_power(stats_b, type_a = 'Attack||Defense', type_b = 'Defense||Attack') {
        let pow = new Decimal(0);

        if(this[type_a]) {
            pow = this[type_a].get_plain_power();
        }
        else {
            return pow;
        }
        if(!stats_b[type_b]) {
            return pow;
        }

        if(this[type_a].fire.gt(0)) {
            pow = pow.add(stats_b[type_b].nature.abs().min(this[type_a].fire).mul(new Decimal(0.5)));
            if(stats_b[type_b].earth.gt(0)) {
                pow = pow.sub(stats_b[type_b].earth.min(this[type_a].fire).mul(new Decimal(0.5)));
            }
        }
        if(this[type_a].nature.gt(0)) {
            pow = pow.add(stats_b[type_b].water.abs().min(this[type_a].nature).mul(new Decimal(0.5)));
            if(stats_b[type_b].earth.gt(0)) {
                pow = pow.sub(stats_b[type_b].fire.min(this[type_a].nature).mul(new Decimal(0.5)));
            }
        }
        if(this[type_a].water.gt(0)) {
            pow = pow.add(stats_b[type_b].earth.abs().min(this[type_a].water).mul(new Decimal(0.5)));
            if(stats_b[type_b].earth.gt(0)) {
                pow = pow.sub(stats_b[type_b].nature.min(this[type_a].water).mul(new Decimal(0.5)));
            }
        }
        if(this[type_a].earth.gt(0)) {
            pow = pow.add(stats_b[type_b].fire.abs().min(this[type_a].earth).mul(new Decimal(0.5)));
            if(stats_b[type_b].earth.gt(0)) {
                pow = pow.sub(stats_b[type_b].water.min(this[type_a].earth).mul(new Decimal(0.5)));
            }
        }

        return pow;
    }
}