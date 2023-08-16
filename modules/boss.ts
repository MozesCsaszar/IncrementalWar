import Decimal from "break_infinity.js";
import { stuff } from "./data";
import { Stats, SubStats } from "./stats";
import { NumberHash } from "./types";
import { Army } from "./army";
import { ButtonGroupClass, PageClass, Fight } from "./base_classes";

class CombatMove {
	name: string;
	desc: string;
	constructor(name: string, desc: string) {
		this.name = name;
		this.desc = desc;
	}

	modifyStats(stats: Stats) {
		return stats;
	}
}

interface IAttackMove {
	attackTargets: Decimal;
}
interface IDefenseMove {
	defenseTargets: Decimal;
}

//A move that only modifies the 'Attack' value of one or more stats thisect(s)
export class AttackMove extends CombatMove implements IAttackMove {
	modifiers: Decimal[];
	modifierTypes: string[];
	attackTargets: Decimal;
	constructor(name: string, desc: string, modifiers: Decimal[] = [], modifierTypes: string[] = [], targets = new Decimal(1)) {
		super(name, desc);
		this.modifiers = modifiers;
		this.modifierTypes = modifierTypes;
		this.attackTargets = targets;
	}

	modifyStats(stats: Stats) {
		stats = stats.add(new Stats([], [])) as Stats;
		for (let i = 0; i < this.modifierTypes.length; i++) {
			const func = stats.get<SubStats>("Attack").get<(o: unknown) => SubStats>(this.modifierTypes[i]);
			stats.set("Attack", func(this.modifiers[i]));
		}
		stats.set("Attack", stats.get<Stats>("Attack"));
		return stats;
	}
}

//A move that only modifies the 'Defense' value of one or more stats thisect(s)
export class DefenseMove extends CombatMove implements IDefenseMove {
	modifiers: Decimal[];
	modifierTypes: string[];
	defenseTargets: Decimal;
	constructor(name: string, desc: string, modifiers: Decimal[] = [], modifierTypes: string[] = [], targets = new Decimal(1)) {
		super(name, desc);
		this.modifiers = modifiers;
		this.modifierTypes = modifierTypes;
		this.defenseTargets = targets;
	}

	modifyStats(stats: Stats) {
		stats = stats.add(new Stats([], []));
		for (let i = 0; i < this.modifierTypes.length; i++) {
			const func = stats.get<SubStats>("Defense").get<(o: unknown) => SubStats>(this.modifierTypes[i]);
			stats.set("Defense", func(this.modifiers[i]));
		}
		return stats;
	}
}

//A move that only modifies the 'Healht' value of one or more stats thisect(s)
export class HealMove extends CombatMove {

}

//A move that executes a combination of the above
export class AttackDefenseMove extends CombatMove implements IAttackMove, IDefenseMove {
	moves: CombatMove[];
	attackTargets: Decimal;
	defenseTargets: Decimal;
	constructor(name: string, desc: string, moves: CombatMove[] = []) {
		super(name, desc);
		this.moves = moves;
		this.attackTargets = new Decimal(0);
		this.defenseTargets = new Decimal(0);
		//get attack and defense targets
		for (let i = 0; i < this.moves.length; i++) {
			if (this.moves[i] instanceof AttackMove) {
				this.attackTargets = this.attackTargets.add((this.moves[i] as AttackMove).attackTargets);
			}
			else if (this.moves[i] instanceof DefenseMove) {
				this.defenseTargets = this.defenseTargets.add((this.moves[i] as DefenseMove).defenseTargets);
			}
		}
	}

	modifyStats(stats: Stats) {
		for (let i = 0; i < this.moves.length; i++) {
			stats = this.moves[i].modifyStats(stats);
		}
		return stats;
	}
}

//A class that stores Moves with rarity and priority and will choose the apropriate one
/*
		How priorities and rarities work:
				-rarities can be Common (0), Uncommon(1), Rare(2), Special(3) and Ultra Rare(4)
				-each rarity has a 1/2^m chance to be chosen (a random choosing between 1 and 2^n will happen, log_2(rand).floor()
				 will be the rarity of the move used)
				-then a move is gotten randomly from the selection
		Please provide moves as a layered array!
*/
export class Moveset {
	static nameTextStart = "<span style=\"color:";
	static moveRarities: NumberHash<string> = { 0: "Common", 1: "Uncommon", 2: "Rare", 3: "Special", 4: "Super", 5: "Ultra" }
	static rarityColors: NumberHash<string> = { 0: "aliceblue", 1: "#20d000", 2: "#4848ff", 3: "#b000b0", 4: "#FF0000", 5: "#FF0000" }
	static colorSpanEnd = "\">";
	static nameTextEnd = "</span>"
	moves: CombatMove[][];
	currentMove?: CombatMove;
	currentMovePlace: number[];

	constructor(moves: CombatMove[][] = [[]]) {
		this.moves = moves;
		this.currentMove = undefined;
		this.currentMovePlace = [];
	}

	getMove() {
		const rarity = this.moves.length - 1 - Math.floor(Math.log2(1 + Math.floor(Math.random() * (2 ** this.moves.length - 1))));
		const move_nr = Math.floor(Math.random() * this.moves[rarity].length);
		this.currentMove = this.moves[rarity][move_nr];
		this.currentMovePlace = [rarity, move_nr];
		return this.currentMove;
	}

	getCurrentMoveName() {
		return this.getMoveName(this.currentMovePlace[0], this.currentMovePlace[1]);
	}

	getMoveName(rarity: number, move_nr: number) {
		return Moveset.nameTextStart + Moveset.rarityColors[rarity] + Moveset.colorSpanEnd + this.moves[rarity][move_nr].name + " (" +
			Moveset.moveRarities[rarity] + ")" + Moveset.nameTextEnd;
	}

	getMove_description(rarity: number, move_nr: number) {
		return this.moves[rarity][move_nr].desc;
	}
}
/*
		Boss types:
				-Mini, Normal
		Boss soldierLossRatio:
				0 - no soldier lost, 1 - all soldies who are wounded (no Health at the end of fight) are lost,
				(0, 1) - a percentage of wounded soldiers lost
*/
//used for boss and miniboss fights
export class Boss {
	stats: Stats;
	name: string;
	desc: string;
	type: string;
	soldierLossRatio: Decimal;
	attaksPerSecond: number;
	size: number;
	moveset: Moveset;
	constructor(name: string, desc: string, stats: Stats, type: string, soldierLossRatio: Decimal, moveset: Moveset) {
		this.stats = stats;
		this.name = name;
		this.desc = desc;
		this.type = type;
		this.soldierLossRatio = soldierLossRatio;
		this.attaksPerSecond = 1;
		this.size = 100;
		this.moveset = moveset;
	}

	attack() {
		return this.stats.get<SubStats>("Attack");
	}

	getText() {
		let t = "<b>" + this.name + "</b><br>" +
			"<i>" + this.type + "</i><br><br>" +
			this.stats.getText() + "<br>" +
			"Attacks/sec: " + this.attaksPerSecond + "<br>" +
			"Size: " + this.size + "<br>" +
			"Moves: ";
		for (let i = 0; i < this.moveset.moves.length; i++) {
			for (let j = 0; j < this.moveset.moves[i].length; j++) {
				if (i != 0 || j != 0) {
					t += ", "
				}
				t += this.moveset.getMoveName(i, j);
			}
		}
		t += ".<br>";
		return t;
	}
}

//simulates a whole army fighting against a boss
class FightingArmy {
	stats: Stats;
	maxUnits: Decimal;
	units: Decimal;
	maxTotalHealth: Decimal;
	totalHealth: Decimal;
	attackTime: Decimal;
	attackCounter: Decimal;
	size: number;
	deployed: Decimal;
	constructor(army: Army) {
		this.stats = army.stats.add(new Stats([], []));
		this.maxUnits = new Decimal(army.size);
		this.units = new Decimal(army.size);
		this.maxTotalHealth = this.units.mul(this.stats.get<Decimal>("Health"));
		this.totalHealth = this.units.mul(this.stats.get<Decimal>("Health"));
		//when attackCounter reaches attackTime, the army attacks
		this.attackTime = new Decimal(1);
		this.attackCounter = new Decimal(0);

		this.size = 10;
		this.deployed = new Decimal(0);
	}

	getTotalAttack(target: FightingBoss) {
		return this.deployed.mul(this.stats.getPower(target.currentStats, "Attack", "Defense")).max(new Decimal(0));
	}

	doAttack(target: FightingBoss) {
		target.getAttacked(this.getTotalAttack(target));
	}

	tick(ticksPerSec: number, target: FightingBoss) {
		this.attackCounter = this.attackCounter.add(new Decimal(1).div(ticksPerSec));
		if (this.attackCounter.gte(this.attackTime)) {
			this.attackCounter = new Decimal(0);
			this.doAttack(target);
		}
	}

	deploy_around_boss(boss: FightingBoss) {
		const max_nr = new Decimal(boss.getNrAround(this.size));
		//while there can be units deployed around boss and you have units, do the deploy action
		while (max_nr.gt(this.deployed) && this.units.gt(this.deployed)) {
			boss.deployUnitAround(this);
			this.deployed = this.deployed.add(1);
		}
	}
}

//simualtes a single soldier fighting against a boss
class FightingUnit {
	army: FightingArmy;
	stats: Stats;
	isDead: boolean;
	constructor(army: FightingArmy) {
		this.army = army;
		this.stats = army.stats.add(new Stats([], []));
		this.isDead = false;
	}

	lose_health(damage: Decimal) {
		const lostHealth = this.stats.get<Decimal>("Health").min(damage);
		this.stats.set("Health", this.stats.get<Decimal>("Health").sub(lostHealth));
		this.army.totalHealth = this.army.totalHealth.sub(lostHealth);
		if (this.stats.get<Decimal>("Health").lte(new Decimal(0.00001))) {
			this.die();
		}
	}

	die() {
		this.army.units = this.army.units.sub(1);
		this.army.deployed = this.army.deployed.sub(1);
		this.isDead = true;
	}
}

//simulates a boss fighting against armies represented by the FightingUnits which can get close enough to attack
class FightingBoss {
	stats: Stats;
	maxUnits: Decimal;
	units: Decimal;
	maxTotalHealth: Decimal;
	totalHealth: Decimal;
	attackTime: Decimal;
	attackCounter: Decimal;
	floatingDamage: Decimal;
	moveset: Moveset;
	move?: CombatMove;
	currentStats?: Stats;
	size: number;
	enemiesAround: FightingUnit[];
	targets: number[];
	constructor(boss: Boss) {
		this.stats = boss.stats.add(new Stats([], []));
		this.maxUnits = new Decimal(1);
		this.units = new Decimal(1);
		this.maxTotalHealth = this.units.mul(this.stats.get<Decimal>("Health"));
		this.totalHealth = this.units.mul(this.stats.get<Decimal>("Health"));
		//when attackCounter reaches attackTime, the boss attacks
		this.attackTime = new Decimal(1);
		this.attackCounter = new Decimal(0);
		this.floatingDamage = new Decimal(0);

		this.moveset = boss.moveset;

		this.move = undefined;
		this.currentStats = undefined;
		this.size = boss.size;

		this.enemiesAround = []
		this.targets = []

		this.chooseMove();
	}

	getTargets() {
		this.targets = [];
		if (this.enemiesAround.length == 0) {
			return;
		}
		if ((this.move as unknown as IAttackMove)?.attackTargets) {
			for (let i = 0; (this.move as unknown as IAttackMove).attackTargets.lte(i); i++) {
				const nr = Math.floor(Math.random() * this.enemiesAround.length);
				this.targets.push(nr);
			}
		}
	}

	chooseMove() {
		this.move = this.moveset.getMove();
		this.currentStats = this.move.modifyStats(this.stats);
		this.getTargets();
	}

	getTotalAttack() {
		let attack = new Decimal(0);
		for (let i = 0; i < this.targets.length; i++) {
			attack = attack.add(this.currentStats!.getPower(this.enemiesAround[this.targets[i]], "Attack", "Defense").max(new Decimal(0)));
		}
		return attack;
	}

	doAttack() {
		//attack them
		const dead: number[] = [];
		for (let i = 0; i < this.targets.length; i++) {
			const enemy = this.enemiesAround[this.targets[i]];
			//if the enemy was targeted multiple times, but by now is dead, just roll with it
			if (enemy.isDead) {
				continue;
			}
			const power = this.currentStats!.getPower(enemy.stats, "Attack", "Defense");
			enemy.lose_health(power);
			if (enemy.isDead) {
				//remove enemy from around boss
				dead.push(this.targets[i]);
				//deploy new unit if applicable
				enemy.army.deploy_around_boss(this);
			}
		}
		//remove the dead from the army
		for (let i = 0; i < dead.length; i++) {
			this.enemiesAround[dead[i]] = -1;
		}
		let i = 0;
		while (i < this.enemiesAround.length) {
			if (this.enemiesAround[i] == -1) {
				this.enemiesAround.splice(i, 1);
			}
			else {
				i++;
			}
		}

		//move feed, maybe move it somewhere else?
		BossFightingPage.feedMoves.push([this, this.moveset.currentMovePlace]);
		if (BossFightingPage.feedMoves.length > BossFightingPage.feedElements.length) {
			BossFightingPage.feedMoves.shift();
		}

		BossFightingPage.update_feed();
		//choose move
		this.chooseMove();
		this.currentStats = this.move!.modifyStats(this.stats);
	}

	tick(ticksPerSec: number) {
		this.attackCounter = this.attackCounter.add(new Decimal(1).div(ticksPerSec));
		if (this.attackCounter.gte(this.attackTime)) {
			this.attackCounter = new Decimal(0);
			this.doAttack();
		}
	}

	getAttacked(power: Decimal) {
		this.totalHealth = this.totalHealth.sub(power);
		this.floatingDamage = this.floatingDamage.add(power);
		const nr_units_dead = this.floatingDamage.div(this.stats.get<Decimal>("Health")).floor();
		if (this.floatingDamage.gte(this.stats.get<Decimal>("Health"))) {
			this.units = this.units.sub(nr_units_dead);
			this.floatingDamage = this.floatingDamage.sub(nr_units_dead.mul(this.stats.get<Decimal>("Health")));
		}
	}
	//a function which calculates how many units can there be around the boss at a given moment
	//works with numbers currently, please change this!
	getNrAround(u_s: number) {
		function isGood(n: number, u_s: number) {
			const x = (n - 2) / (2 * n) * Math.PI;
			if (Math.cos(x) / (1 - Math.cos(x)) >= u_s) {
				return true;
			}
			return false;
		}

		u_s = u_s / this.size;
		let bot = 2, top = this.size * 10;
		let mid = Math.floor((top + bot) / 2);
		while (!isGood(mid, u_s)) {
			top = mid;
			mid = Math.floor((top + bot) / 2);
			if (mid == 2) {
				return 2;
			}
		}
		let last;
		while (isGood(mid, u_s)) {
			last = mid;
			bot = mid;
			mid = Math.floor((top + bot) / 2);
		}
		return last;
	}

	deployUnitAround(army: FightingArmy) {
		this.enemiesAround.push(new FightingUnit(army));
	}
}

class BossSelectArmyButtonsClass extends ButtonGroupClass {
	number: number;
	selected: number;
	buttons: any;
	constructor(containerIdentifier: string, buttonIdentifier: string, selectedStyle, defaultStyle, number) {
		containerIdentifier += ".n" + String(number);
		super(containerIdentifier, buttonIdentifier, selectedStyle, defaultStyle);

		this.number = number;
		this.selected = -1;
	}
	showButton(buttonNr: number) {
		super.showButton(buttonNr);
		this.buttons[buttonNr].hidden = false;
	}
	hideButton(buttonNr: number) {
		super.hideButton(buttonNr);
		this.buttons[buttonNr].hidden = true;
	}
	deselect() {
		if (this.selected != -1) {
			for (const [key, value] of Object.entries(this.defaultStyle)) {
				this.buttons[this.selected].style[key] = value;
			}
			this.selected = -1;
		}
	}
	defaultStyle(defaultStyle: any) {
		throw new Error("Method not implemented.");
	}

	buttonClick(buttonNr: number) {
		//reset old armies
		if (BossArmySelectionPage.fight!.selectedArmies[this.number] != -1) {
			for (let k = 0; k < BossArmySelectionPage.nrArmySelects; k++) {
				if (this.number != k) {
					BossArmySelectionPage.armySelects[k].showButton(buttonNr);
				}
			}
		}
		//if you select the same army again
		if (buttonNr == this.selected) {
			BossArmySelectionPage.fight!.selectedArmies[this.number] = -1;
			BossArmySelectionPage.armyInfos[this.number].innerHTML = "No army to be seen here.";
		}
		//if you selected a new army
		else {
			BossArmySelectionPage.fight!.selectedArmies[this.number] = buttonNr;
			BossArmySelectionPage.armyInfos[this.number].innerHTML = Player.armies[buttonNr].get_fighting_stats_text();
			for (let k = 0; k < BossArmySelectionPage.nrArmySelects; k++) {
				if (k != this.number) {
					BossArmySelectionPage.armySelects[k].hideButton(buttonNr);
				}
			}
		}

		//do button group things
		if (this.selected == buttonNr) {
			this.deselect();
		}
		else {
			if (this.selected != -1) {
				for (const [key, value] of Object.entries(this.defaultStyle)) {
					this.buttons[this.selected].style[key] = value;
				}
			}
			this.selectButton(buttonNr);
		}
		BossArmySelectionPage.showHideFightButton();
	}
}

class BossArmySelectionPageClass extends PageClass {
	fight?: Fight;
	nrArmySelects: number;
	armySelects: BossSelectArmyButtonsClass[];
	armyInfos: HTMLElement[];
	nrArmies: number;
	bossInfo: HTMLElement;
	difficultyGauge: any;
	backButton: any;
	startFightButton: any;
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
		this.armyInfos = document.querySelectorAll(".select_boss_army_info") as unknown as HTMLElement[];
		this.bossInfo = document.querySelector("#BossInfo") as unknown as HTMLElement;
		this.difficultyGauge = document.querySelector("#BossFightDifficultyGauge");
		this.fight = undefined;
		this.backButton = document.querySelector("#BackFromBossArmySelectionPage");
		this.startFightButton = document.querySelector("#StartBossFightButton");

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
			HidePages("BossFightingPage");
		});
		//Back to tower page button
		this.backButton.addEventListener("click", () => {
			//get page buttons back
			(document.querySelector("#PageButtonsContainer") as unknown as HTMLElement).hidden = false;
			(document.querySelector("#PageTopResourcesContainer") as unknown as HTMLElement).hidden = false;
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

class BossFightingPageClass extends PageClass {
	feedMoves: CombatMove[][];
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

		let statusBars = document.querySelectorAll(".army_in_boss_fight_bar") as unknown as HTMLElement[];
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

		statusBars = document.querySelectorAll(".boss_in_boss_fight_bar") as unknown as HTMLElement[];
		for (let i = 0; i < this.nrBossStatusBats; i++) {
			this.bossStatusBars.push([]);
			for (let j = 0; j < this.barElementsPerBoss; j++) {
				this.bossStatusBars[i].push(statusBars[i * this.barElementsPerBoss + j]);
			}
		}

		//feed
		this.feedElements = [];
		this.feedMoves = [];
		this.feedElements = document.querySelectorAll(".boss_fight_move_feedElement") as unknown as HTMLElement[];

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
			const boss_in_boss_fight_name = document.querySelector(".boss_in_boss_fight_name") as unknown as HTMLElement;
			boss_in_boss_fight_name.innerHTML = this.fight!.bosses[0];
		}
		this.timesVisited++;
	}
	displayEveryTick() {
		//fill in sliders
		for (let i = 0; i < this.fightingArmies.length; i++) {
			//health foreground
			this.armyStatusBars[i][0].style.width = this.getWidth(this.fightingArmies[i].totalHealth, this.fightingArmies[i].maxTotalHealth) + "";
			this.armyStatusBars[i][1].innerHTML = StylizeDecimals(this.fightingArmies[i].totalHealth) + "/" + StylizeDecimals(this.fightingArmies[i].maxTotalHealth);
			//unit nr foreground
			this.armyStatusBars[i][2].style.width = this.getWidth(this.fightingArmies[i].units, this.fightingArmies[i].maxUnits) + "";
			this.armyStatusBars[i][3].innerHTML = StylizeDecimals(this.fightingArmies[i].units, true) + "/" + StylizeDecimals(this.fightingArmies[i].maxUnits, true) +
				" (" + StylizeDecimals(this.fightingArmies[i].deployed, true) + ")";
			//attack status foreground
			this.armyStatusBars[i][4].style.width = this.getWidth(this.fightingArmies[i].attackCounter, this.fightingArmies[i].attackTime) + "";
			this.armyStatusBars[i][5].innerHTML = StylizeDecimals(this.fightingArmies[i].getTotalAttack(this.fightingBosses[0]));
		}

		for (let i = 0; i < this.fightingBosses.length; i++) {
			//health foreground
			this.bossStatusBars[i][0].style.width = this.getWidth(this.fightingBosses[i].totalHealth, this.fightingBosses[i].maxTotalHealth) + "";
			this.bossStatusBars[i][1].innerHTML = StylizeDecimals(this.fightingBosses[i].totalHealth) + "/" + StylizeDecimals(this.fightingBosses[i].maxTotalHealth) + "";
			//unit nr foreground
			this.bossStatusBars[i][2].style.width = this.getWidth(this.fightingBosses[i].units, this.fightingBosses[i].maxUnits) + "";
			this.bossStatusBars[i][3].innerHTML = StylizeDecimals(this.fightingBosses[i].units, true) + "/" + StylizeDecimals(this.fightingBosses[i].maxUnits, true);
			//attack status foreground
			this.bossStatusBars[i][4].style.width = this.getWidth(this.fightingBosses[i].attackCounter, this.fightingBosses[i].attackTime) + "";
			this.bossStatusBars[i][5].innerHTML = StylizeDecimals(this.fightingBosses[i].getTotalAttack());
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

const BossFightingPage = new BossFightingPageClass("BossFightingPage");

class BossFightingResultPageClass extends PageClass {
	resultInfo: HTMLElement;
	backButton: HTMLElement;
	constructor(name: string) {
		super(name);

		this.resultInfo = document.querySelector("#AfterFightMessage") as unknown as HTMLElement;
		this.backButton = document.querySelector("#BackButtonFromResults") as unknown as HTMLElement;

		this.initializeEventListeners();
	}
	initializeEventListeners() {
		//Back to tower page button
		this.backButton.addEventListener("click", function () {
			//get resource bar and page buttons back
			const pageButtonsContainer = document.querySelector("#PageButtonsContainer") as unknown as HTMLElement;
			pageButtonsContainer.hidden = false;
			const pageTopResourcesContainer = document.querySelector("#PageTopResourcesContainer") as unknown as HTMLElement;
			pageTopResourcesContainer.hidden = false;
			//return to tower page
			HidePages("TowerPage");
		});
	}
	displayOnLoad() { }
	display() {
		this.resultInfo.innerHTML = this.generateMessage();
	}
	displayEveryTick() { }
	save() {
		const saveText = super.save();

		return saveText;
	}
	load(saveText: string) {
		const saveTextArr: string[] = saveText.split("/*/");
		const i = super.load(saveTextArr);
		return i;
	}
	generateMessage() {
		let t;
		if (BossFightingPage.fightingArmiesNr == 0) {
			t = "You lost!<br>";
			if (BossFightingPage.fight?.loseSoldiers) {
				t += "With your loss, you lost all your soldiers as well!";
			}
			else {
				t += "Don't worry though, you didn't lose anyone, the magic of the Tower kept them all alive.";
			}

		}
		else {
			t = "You won!<br>";
			if (BossFightingPage.fight?.loseSoldiers) {
				t += "Though you lost part of your army.";
			}
			else {
				t += "Thank you for playing the game! <br> If you have a minute, I would really appreciate it if " +
					"you could give me some feedback through <a href=\"https://forms.gle/rMwKTcsQJGxfFLDN8\">a survey here</a> or in private.<br> Thank you for your time again!";
			}
		}
		return t;
	}
}

export const BossFightingResultPage = new BossFightingResultPageClass("BossFightingResultPage")