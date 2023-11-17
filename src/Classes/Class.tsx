import { action, computed, makeAutoObservable, makeObservable, observable } from 'mobx'
// @ts-ignore
import { v4 as uuid } from 'uuid'

export class SelectiveElement {
    available: boolean = false
    protected mediator: Mediator
    justHighlighted: boolean = false
    select: Function

    constructor (mediator: Mediator) {
        this.mediator = mediator
        this.select = this.clickObserver('select').bind(this) 
        makeObservable(this, {
            available: observable,
            justHighlighted: observable,
            highlighted: computed,
            setAvailable: action,
            highlight: action,
        })
    }

    setAvailable = (value: boolean) => {
        this.available = value
    } 

    highlight = (value: boolean, clickable: boolean = true) => {
        this.justHighlighted = value
        this.available = clickable ? value : false
    }

    get highlighted () {
        return this.available || this.justHighlighted
    }

    clickObserver = (message?: string, condition: boolean = true) => () => {
        if (this.available && condition) {
            this.mediator.notify(this, message || 'click')
        }
    } 
}



export abstract class Guild {
    abstract readonly action: string[]
    readonly code: string
    abstract readonly name: string
    abstract readonly icon: string 
    abstract readonly color: string
    readonly extraPointsForDeath: number = 0
    readonly pointsForKill: number = 1

    constructor (code: string) {
        this.code = code
    }

    spawn = async (field: Field, fields: FieldsController, killer: Killer, cards: CardsController): Promise<any> => {
        console.log(field, fields, killer, cards)
    }
   
    abstract activate (field: Field, fields: FieldsController, killer: Killer, cards: CardsController): Promise<any>

    protected attackFirstInCol = (field: Field, fields: FieldsController, killer: Killer, damage: number) => {
        const elemental = fields.getFirstElementalFieldInThisColSync(field)

        if (elemental) {
            killer.hit(field, elemental, damage)
        }
    }

    protected transferToAny = async (field: Field, fields: FieldsController) => {
        const newPlace = await fields.getMyAnyLastEmptyFieldAsync(field)
        fields.transferElementalToNewField(field, newPlace!)

        return newPlace!
    }

    protected transferToNeighbors = async (field: Field, fields: FieldsController) => {
        const newPlace = await fields.getMyNeighBoorLastEmptyFieldAsync(field)
        fields.transferElementalToNewField(field, newPlace!)

        return newPlace!
    } 
}

export class IceGuild extends Guild {
    readonly action = ['Если последнему врагу в этой лоакции уже нанесен хотя бы 1 урон, нанесите ему 4 урон', 'В ином случае нанесите ему 1 урон'] 
    readonly name: string = 'Лед'
    readonly icon: string = ''
    readonly color: string = 'blue-200'

    activate = async (field: Field, fields: FieldsController, killer: Killer) => {
        const elemental = fields.getLastEnemyElementalInThisColSync(field)
        
        if (elemental) {
            const damage =elemental.elemental!.health < elemental.elemental!.maxHealth ? 4 : 1
            
            killer.hit(field, elemental, damage)
        }
    }
}

export class LightGuild extends Guild {
    readonly action = ['Нанесите 2 урона первому врагу в этой локации.', 'Снимите 1 урон с активированного элементаля Света или с любого другого союзника'] 
    readonly name: string = 'Свет'
    readonly icon: string = ''
    readonly color: string = 'yellow-400'

    activate = async (field: Field, fields: FieldsController, killer: Killer) => {
        this.attackFirstInCol(field, fields, killer, 2);

        (await fields.getMyAnyElementalAsync())!.elemental!.heal(1)
    }
}

export class FireGuild extends Guild {
    readonly action = ['Нанесите 3 урона первому врагу в этой локации.', 'Нанесите 1 урон союзнику, который выложен сразу за этим элменталем огня'] 
    readonly name: string = 'Огонь'
    readonly icon: string = ''
    readonly color: string = 'red-500'

    activate = async (field: Field, fields: FieldsController, killer: Killer) => {
        this.attackFirstInCol(field, fields, killer, 3)

        if (field.next && field.next.elemental) {
            killer.hit(field, field.next, 1)
        }
    }
}

export class CrystalGuild extends Guild {
    readonly action = ['Нанесите 4 урона первому врагу в этой локации. Когда элементаль кристалл уничтожается, соперник получает на 1 очко энергии больше']
    readonly name: string = 'Кристал'
    readonly icon: string = ''
    readonly color: string = 'indigo-100'
    readonly extraPointsForDeath: number = 1

    activate = async (field: Field, fields: FieldsController, killer: Killer) => {
        this.attackFirstInCol(field, fields, killer, 4)
    }
}

export class WaterGuild extends Guild {
    readonly action = ['Нанесите 2 урона первому врагу в этой локации', 'Переместите этого элменталя Воды в соседнюю локацию.', 'Нанесите 1 урон первому врагу в новой локации' ]  
    readonly name: string = 'Вода'
    readonly icon: string = ''
    readonly color: string = 'blue-400'

    activate = async (field: Field, fields: FieldsController, killer: Killer) => {
        this.attackFirstInCol(field, fields, killer, 2)
        const newPlace = await this.transferToNeighbors(field, fields)
        this.attackFirstInCol(newPlace!, fields, killer, 1)
    }
}

export class AirGuild extends Guild {
    readonly action = ['Переместите этого элменталя Воздуха в любую другую локацию.', 'Нанесите 1 урон первому врагу в новой локации, а также обеих соседних']  
    readonly name: string = 'Воздух'
    readonly icon: string = ''
    readonly color: string = 'grey-200'

    activate = async (field: Field, fields: FieldsController, killer: Killer) => {
        const newPlace = await this.transferToAny(field, fields)

        fields.getEnemyFirstElementalsInThreeColsSync(newPlace!).forEach(f => {
            killer.hit(newPlace, f, 1)
        })
    }
}

export class DarkGuild extends Guild {
    readonly action = ['Переместите этого элементаля Тьмы в другую локацию.', 'Нанесите 1 урон первому врагу в этой локации. Если после этого враг уничтожен, получите на 1 очко энергии больше']
    readonly name: string = 'Тьма'
    readonly icon: string = ''
    readonly color: string = 'grey-800'
    readonly pointsForKill: number = 2

    activate = async (field: Field, fields: FieldsController, killer: Killer) => {
        this.attackFirstInCol(field, fields, killer, 2)
    }
}

export class FloraGuild extends Guild {
    readonly action = ['Нанесите 2 урона первому врагу в соседней локации', 'Переместите данного врага в локацию, где находится этот элементаль Флоры']
    readonly name: string = 'Флора'
    readonly icon: string = ''
    readonly color: string = 'green-500'

    activate = async (field: Field, fields: FieldsController, killer: Killer) => {
        const neighboor = await fields.getNeighBoorEnemyFirstElementalAsync(field)
        
        if (neighboor) {
            killer.hit(field, neighboor, 2)

            fields.transferElementalToNewField(neighboor, fields.getLastFieldInNode(field.parent.up!))
        }
    }
}

export class LightingGuild extends Guild {
    readonly action = ['Нанесите 2 урона любому врагу в этой локации', 'Если при этом элменталь Молнии уничтожает врага, тут же воспользуйтесь этой способностью еще раз']
    readonly name: string = 'Молния'
    readonly icon: string = ''
    readonly color: string = 'indigo-600'

    activate = async (field: Field, fields: FieldsController, killer: Killer) => {
        let canRepeate = false
        do {
            const enemy = await fields.getEnemyAnElementalInThisNode(field)
  
            if (enemy) {
                const damage = 2

                if (enemy.elemental!.health <= damage) {
                    canRepeate = true
                } else {
                    canRepeate = false
                }

                killer.hit(field, enemy, damage)
            } else {
                canRepeate = false
            }
            
        } while (canRepeate)
    }
}

export class GroundGuild extends Guild {
    readonly action = ['Когда вы призываете этого элменталя Земли, нанесите по 1 урону каждому врагу в этой локации.', 'При активации нанесите 2 урона первому врагу в этой локации']
    readonly name: string = 'Земля'
    readonly icon: string = ''
    readonly color: string = 'yellow-800'

    activate = async (field: Field, fields: FieldsController, killer: Killer) => {
        this.attackFirstInCol(field, fields, killer, 2)
    }

    spawn = async (field: Field, fields: FieldsController, killer: Killer) => {
        fields.getEnemyAllElementalsInThisNodeSync(field).forEach(enemy => {
            killer.hit(field, enemy, 2)
        })
    }
}

export class AcidGuild extends Guild {
    readonly action = ['Нанесите 3 урона первому врагу в этой локации.', 'Нанесите 1 урон второму врагу в этой локации. Если при этом элементаль Кислоты уничтожает врага вы не получаете очков энергии']
    readonly name: string = 'Кислота'
    readonly icon: string = ''
    readonly color: string = 'green-200'
    readonly pointsForKill: number = 0

    activate = async (field: Field, fields: FieldsController, killer: Killer) => {
        const enemies = fields.getEnemyAllElementalsInThisNodeSync(field)
        killer.hit(field, enemies[0], 3)
        killer.hit(field, enemies[1], 1)
    }
}

export class CometGuild extends Guild {
    readonly action = ['Нанесите 2 урона первому врагу в этой локации', 'Если у вас на руке меньше 7 карт, возьмите 1 карту из своей колоды']
    readonly name: string = 'Комета'
    readonly icon: string = ''
    readonly color: string = 'blue-800'

    activate = async (field: Field, fields: FieldsController, killer: Killer, cards: CardsController, ) => {
        this.attackFirstInCol(field, fields, killer, 2)

        if (cards.handCardDeck.cards.length < 7) {
            cards.addCardsToHand(1)
        }
    }
}

export class LoveGuild extends Guild {
    readonly action  = ['Когда вы призываете этого элменталя любви, снимите все жетоны урона с одного союзника в этой локации', 'Нанесите 2 урона первому врагу в этой локации']
    readonly name: string = 'Любовь'
    readonly icon: string = ''
    readonly color: string = 'purple-400'

    activate = async (field: Field, fields: FieldsController, killer: Killer) => {
        this.attackFirstInCol(field, fields, killer, 2)
    }

    spawn = async (field: Field, fields: FieldsController) => {
        const healedField = await fields.getMyAnyElementalInThisNodeAsync(field)
        
        if (healedField) {
            healedField.elemental!.healToMax()
        }
    }
}

export class MusicGuild extends Guild {
    readonly action = ['Нанесите 2 урона первому врагу в этой локации', 'Если при этом элементаль Музыки уничтожает врага, переместите его на вашу сторону разлома в одну из соседних локаций']
    readonly name: string = 'Лед'
    readonly icon: string = ''
    readonly color: string = 'zinc-200'

    activate = async (field: Field, fields: FieldsController, killer: Killer, cards: CardsController,) => {
        const enemy = fields.getFirstElementalFieldInThisColSync(field)

        if (enemy) {
            killer.hitWithoutDeath(field, enemy, 2)
            const enemyElemental = enemy.elemental!

            if (enemyElemental.isDead) {
                enemyElemental.healToMax()

                const neighboorPlace = await fields.getMyNeighBoorLastEmptyFieldAsync(field)

                fields.transferElementalToNewField(enemy, neighboorPlace!)

                neighboorPlace!.elemental!.guild.spawn(neighboorPlace!, fields, killer,  cards)
            }
        }
    }
}

export class BeastGuild extends Guild {
    readonly action = ['Переместите этого элменталя Оборотня в соседнюю локацию', 'Если этому элменталю Оборотня уже нанесен хотя бы 1 урон, нанесите 3 урона первому врагу в новой локации. В ином случае нанесите врагу 2 урона']
    readonly name: string = 'Оборотень'
    readonly icon: string = ''
    readonly color: string = 'red-90'

    activate = async (field: Field, fields: FieldsController, killer: Killer) => {
        const newPlace = await this.transferToNeighbors(field, fields)

        const damage = newPlace.elemental!.health < newPlace.elemental!.maxHealth 
            ? 3
            : 2

        this.attackFirstInCol(newPlace, fields, killer, damage)
    }
}

export class MagneticGuild extends Guild {
    readonly action = ['Нанесите 2 урона последнему врагу в этой локации', 'Переместите данного врага и этого элементаля Магнетизма в соседнюю локаци']
    readonly name: string = 'Магнетизм'
    readonly icon: string = ''
    readonly color: string = 'grey-600'

    activate = async (field: Field, fields: FieldsController, killer: Killer) => {
        const enemy = fields.getLastEnemyElementalInThisColSync(field)

        if (enemy) {
            killer.hit(field, enemy, 2)
        }

        const neighbour = await fields.getMyNeighBoorLastEmptyFieldAsync(field)
        fields.transferElementalToNewField(field, neighbour!)
       
        if (enemy) {
            const newEnemyPlace = fields.getLastFieldInNode(neighbour!.parent.up!)
            fields.transferElementalToNewField(enemy, newEnemyPlace )
        }  
    }
}

export class SandGuild extends Guild {
    readonly action = ['Переместите этого элементаля Песка в любую дургую локацию.', 'Нанесите по 1 урону каждому врагу в новой локации.', 'Снимите 1 урон с активированного элементаля Песка']
    readonly name: string = 'Песок'
    readonly icon: string = ''
    readonly color: string =  'yellow-100'

    activate = async (field: Field, fields: FieldsController, killer: Killer) => {
        const newPlace = await this.transferToAny(field, fields)

        fields.getEnemyAllElementalsInThisNodeSync(field).forEach(enemy => {
            killer.hit(newPlace, enemy, 1)
        })

        newPlace.elemental!.heal(1)
    }
}

export class LavaGuild extends Guild {
    readonly action = ['Нанесите по 2 урона каждому из первых врагов в соседних локациях', "Нанесите 1 урон этому элменталю Лвы и всем союзникам, которые выложены перед ним"]
    readonly name: string = 'Лава'
    readonly icon: string = ''
    readonly color: string = 'orange-600'

    activate = async (field: Field, fields: FieldsController, killer: Killer) => {
        const enemies = fields.getAllNeighBoorEnemyFirstElementalsSync(field)
        const fieldsBefore = fields.getFieldsBeforeSync(field)

        const attack: Field[] = [...enemies, ...fieldsBefore, field]

        attack.forEach(f => {
            killer.hit(field, f, 2)
        })
    }
}

export const BASE_GUILDS_CODE = [
    'ICE', 'LIGHT', 'FIRE', 'CRYSTAL', 'WATER',
    'AIR', 'DARK', 'FLORA', 'LIGHTNING', 'GROUND'
] as const

export const ADD_GUILDS = [
    'ACID', 'COMET', 'LOVE', 'MUSIC', 'BEAST',
    'MAGNETIC', 'LAVA', 'SAND'
] as const

export type GuildCode = typeof BASE_GUILDS_CODE[number] | typeof ADD_GUILDS[number]

export class GuildFactory {
    private static instance: GuildFactory
    private cached: Partial<Record<GuildCode, Guild>> = {}

    static getInstance() {
        if (!GuildFactory.instance) {
            GuildFactory.instance = new GuildFactory()
        }

        return GuildFactory.instance
    }  

    create = (code: GuildCode) => {
        if (this.cached[code]) {
            return this.cached[code]
        }

        const GuildClassById: Record<GuildCode, any> = {
            'ICE': IceGuild,
            'LIGHT': LightGuild,
            'FIRE': FireGuild,
            'CRYSTAL': CrystalGuild,
            'WATER': WaterGuild,
            'AIR': AirGuild,
            'DARK': DarkGuild,
            'FLORA': FloraGuild,
            'LIGHTNING': LightingGuild,
            'GROUND': GroundGuild,
            'ACID': AcidGuild,
            'COMET': CometGuild,
            'LOVE': LoveGuild,
            'MUSIC': MusicGuild,
            'BEAST': BeastGuild,
            'MAGNETIC': MagneticGuild,
            'LAVA': LavaGuild,
            'SAND': SandGuild
        }

        const guild = new GuildClassById[code](code)
        this.cached[code] = guild

        return guild
    }

    createSeveral = (codes: GuildCode[]) => {
        return codes.map(this.create)
    }
}


export class MobData {
    readonly guild: Guild
    readonly value: number
    readonly code: string

    constructor(guild: Guild, value: number) {
        this.guild = guild
        this.value = value
        this.code = `${guild.code}_${value}`
    }
}

export interface Mediator<T = SelectiveElement> {
    notify(target: T, message: string): void
}

export class User {
    readonly id: string
    readonly name: string
    readonly avatar: null | string = null
    readonly rating: number

    constructor (id: string, name: string, avatar: string | null, rating?: number) {
        this.id = id
        this.name = name
        this.avatar = avatar
        this.rating = rating || 0
    }
}

export type UserTuple = [User, Team]

type NodeNeighbors =  'up' | 'down' | 'next' | 'prev'

export class MapNode {
    next: MapNode | null = null
    prev: MapNode | null = null
    up: MapNode | null = null 
    down: MapNode | null = null 
    readonly user: UserTuple | null
    private mediator: Mediator
    readonly index: number = 0
    fields: Field[]

    constructor (mediator: Mediator, user?: UserTuple, index?: number) {
        this.user = user || null
        this.mediator = mediator
        this.fields = []
        
        if (user) {
            this.addField()
        }
       
        this.index = index || this.index
    }

    get lastField () {
        return this.fields.at(-1) || null
    }

    setFields = (fields: Field[]) => {
        this.fields = fields
    }

    addField = () => {
        const field = new Field(this, this.mediator)

        if (this.fields.length > 0) {
            this.fields.at(-1)!.next = field
            field.prev = this.fields.at(-1)!
        }
       
        this.fields.push(field)

        return field
    }

    get code () {
        if (this.user) 
            return `${this.user[0].id}_${this.index}`
        return this.index
    }

    removeField = (field: Field) => {
        this.fields = this.fields.filter(f => f !== field)
    }

    private createNode = (pos: NodeNeighbors, user?: UserTuple, index?: number) => {
        const oposites: Record<NodeNeighbors, NodeNeighbors> = {
            'up': 'down',
            'next': 'prev',
            'down': 'up',
            'prev': 'next'
        }
        const node = new MapNode(this.mediator, user, index)
        this[pos] = node
        node[oposites[pos]] = this

        return node
    }

    createUpNode = (user?: UserTuple, index?: number) => {
        return this.createNode('up', user, index)
    }

    createDownNode = (user?: UserTuple, index?: number) => {
        return this.createNode('down', user, index)
    }

    createNextNode = (user?: UserTuple, index?: number) => {
        return this.createNode('next', user, index)
    }

    get isEmpty() {
        return !this.fields[0].elemental && this.fields.length === 1
    }
}

export class Field extends SelectiveElement {
    next: null | Field = null
    prev: null | Field = null
    parent: MapNode
    elemental: null | Elemental = null

    constructor (parent: MapNode, mediator: Mediator) {
        super(mediator)
        this.parent = parent

        return this
    }

    get code () {
        if (this.elemental && this.parent.user) {
            return this.elemental.code
        }

        return this.parent.index
    }

    createElemental(data: MobData, helath?: number) {
        if (!this.elemental) {
            this.elemental = new Elemental(data, helath)
            this.next = new Field(this.parent, this.mediator)

            this.parent.addField()
        }
    }

    delete () {
        if (this.prev) {
            this.prev.next = this.next

            if (this.next) {
                this.next.prev = this.prev
            }
        } else {
            if (this.next) {
                this.next!.prev = null
            }   
        }

        this.parent.removeField(this)
    }
}


export class Elemental {
    health: number
    readonly mobData: MobData
    readonly code: string
    
    constructor(data: MobData, currentHealth?: number) {
        this.mobData = data
        this.health = currentHealth || this.maxHealth
        this.code = `${data.code}_${this.health}`
    }

    get maxHealth () {
        return this.mobData.value
    }

    get guild () {
        return this.mobData.guild
    }

    hit(damage: number) {
        this.health -= damage
    } 

    heal(hp: number) {
        this.health = Math.max(this.maxHealth, this.health + hp)
    }

    healToMax = () => {
        this.health = this.maxHealth
    }

    get isDead () {
        return this.health <= 0
    }
}

export enum CardsActionMessages {
    summon = 'SUMMON',
    activate = 'ACTIVATE',
    select = 'SELECT',
    draw = 'DRAW'
}


export class Card extends SelectiveElement {
    usable: boolean = false
    readonly mobData: MobData

    constructor (mediator: Mediator, data: MobData) {
        super(mediator)
        this.mobData = data
        makeObservable(this, {
            usable: observable,
            setUsable: action
        })
    }

    setUsable = (status: boolean) => {
        this.usable = status
    }

    summon = this.clickObserver(CardsActionMessages.summon, this.usable)
    activate = this.clickObserver(CardsActionMessages.activate, this.usable)
    select = this.clickObserver(CardsActionMessages.select, !this.usable)
}

export class Deck<T = MobData> {
    cards: T[] = []
    
    add = (card: T) => {
        this.cards.push(card)
    }
    
    remove = (card: T) => {
        this.cards = this.cards.filter(c => c !== card)
    }

    setCards = (cards: T[]) => {
        this.cards = cards
    }

    shuffle = () => {
        this.cards.reverse().forEach((_, index) => {
            const j = Math.floor(Math.random() * (index + 1));
            this.swapCards(index, j)
        });
    }

    private swapCards = (index1: number, index2: number) => {
        [this.cards[index1], this.cards[index2]] = [this.cards[index2], this.cards[index1]];
    }

    get size() {
        return this.cards.length
    }

    changeOrder = (card: T, newPlace: number) => {
        const indexOfCard = this.cards.indexOf(card)

        if (indexOfCard >= 0 && newPlace >= 0 && newPlace !== indexOfCard) {
            this.swapCards(indexOfCard, newPlace)
        }
    }
}


type Command<T  = unknown> = {
    target: T
    message: string
}

export class BaseController implements Mediator {
    enabled: boolean = false
    readonly highlighted: Set<SelectiveElement> = new Set<SelectiveElement>()
    protected resolve: ((payload: Command) => void ) = (_: Command) => {}

    constructor() {
        makeObservable(this, {
            enabled: observable,
            setEnabled: action
        })
        this.resetHighlights.bind(this)
    }

    setEnabled = (status: boolean) => {
        this.enabled = status
    }

    notify(target: any, message: string): void {
        this.resolve({ target, message })
    }

    resetHighlights() {
        this.highlighted.forEach(el => el.highlight(false, true))
        this.highlighted.clear()
    }

    highlight = (el: SelectiveElement, clickable: boolean = false, highlight: boolean= true) => {
        if (highlight) {
            el.highlight(true, clickable)
        }

        this.highlighted.add(el)
    }

    reset = () => {
        this.resolve = (_: Command) => {}
        this.resetHighlights()
    }

    protected observe = (): Promise<Command> => {
        return new Promise<Command>((res) => {
            this.resolve = res as any
       }).then(data => {
            this.reset()
            return data
       })
     }
}


export class Iterator {
    iterateThroughLine = (start: MapNode, cb: (node: MapNode) => void, end?: MapNode, direction: 'next' | 'prev' = 'next', skipEmpty: boolean = false) => {
    
        let selectedNode: MapNode | null = start
        let lastNode: MapNode = start

        while (selectedNode && selectedNode !== end && (skipEmpty || !!selectedNode.user)) {
            cb(selectedNode)
            lastNode = selectedNode
            selectedNode = selectedNode[direction]
        }

        if (selectedNode && selectedNode === end) {
            cb(selectedNode)
            lastNode = selectedNode
        }

        return lastNode
    }

    iterateThroughRound = (start: MapNode, cb: (node: MapNode) => void, clockwise: boolean = false) => {

        let end = clockwise ? start.next : start.prev
        this.iterateThroughLine(start, cb, end!, 'next', true)
    }
}

export class CardsController extends BaseController {
    readonly leftCardsDeck: Deck = new Deck()
    readonly handCardDeck: Deck<Card> = new Deck<Card>()
    readonly cardsDeck: Deck = new Deck()
    canDraw: boolean = false
    private readonly maxCardsInHand: number

    constructor(maxCountInHand?: number) {
        super()
        this.maxCardsInHand = maxCountInHand || 7
    }

    addCardsToHand(count: number) {
        if (this.handCardDeck.size < this.maxCardsInHand) {
            for (let i = 0; i < count; i++) {
                if (this.cardsDeck.size > 0) {
                    const takenMobData = this.cardsDeck.cards.pop()!
                    this.handCardDeck.add(this.createCard(takenMobData))
                } else {
                    this.updateCardsDeck()
                }
            }
        }
    }

    private createCard = (data: MobData) => {
        return new Card(this, data)
    }

    replenishHandDeck = () => {
        this.addCardsToHand(this.maxCardsInHand - this.handCardDeck.size)
    }

    updateCardsDeck() {
        this.leftCardsDeck.cards.forEach((_,__, arr) => {
            this.cardsDeck.add(arr.pop()!)
        });
        this.cardsDeck.shuffle()
    }

    makeDraw() {
        if (this.canDraw) {
            this.resolve({ target: this, message: CardsActionMessages.draw })
        }
    }

    private highlightCardsSameAny = (data: any, cb: (data: any, card: MobData) => boolean, clickable?: boolean) => {
        this.iterateThroughHand(card => {
            if (cb(data, card.mobData)) {
                this.highlight(card, clickable, this.enabled)
                card.setUsable(false)
            }
        })
    }

    highlightCardsSameGuild = (guild: Guild, clickable?: boolean) => {
        this.highlightCardsSameAny(guild, (data, c) => data === c.guild, clickable)
    }

    highlightCardsByValue = (value: number, clickable?: boolean) => {
        this.highlightCardsSameAny(value, (data, c) => data === c.value, clickable)
    }

    getCardsSameGuildAsync = (guild: Guild) => {
        this.highlightCardsSameGuild(guild, true)

        return this.observe().then(data => {
            this.handCardDeck.remove(data.target as Card)
            return (data.target as Card).mobData
        })
    }

    moveCardFromHandToLeft = (data: MobData) => {
        const found = this.handCardDeck.cards.find(card => card.mobData === data)

        if (found) {
            this.handCardDeck.remove(found)
            this.leftCardsDeck.add(data)
        }
    }

    resetHighlights = (): void => {
        this.highlighted.forEach(el => {
            el.highlight(false, true);
            (el as Card).setUsable(false)
        })
        this.highlighted.clear()
    }

    getCardsSameValueAsync = (value: number) => {
       this.highlightCardsByValue(value, true)

       return this.observe().then(data => {
            this.handCardDeck.remove(data.target as Card)
            return (data.target as Card).mobData
        })
    }

    highlightHand = (clickable?: boolean) => {
        this.iterateThroughHand(card => {
            this.highlight(card, clickable, this.enabled)
            card.setUsable(true)
        })
    }

    getSomeCardCommand = () => {
        if (this.enabled) {
            this.canDraw = this.handCardDeck.size < 7
        }

        this.highlightHand(true)

        return this.observe() as Promise<Command<MobData>>
    }

    private iterateThroughHand = (cb: (card: Card) => void) => {
        this.handCardDeck.cards.forEach(cb)
    }

    pushCardToHand = (data: MobData) => {
        this.handCardDeck.add(this.createCard(data))
    }
}

export class FieldsController extends BaseController {
    startNode: MapNode = new MapNode(this)
    iterator: Iterator = new Iterator()

    getLastEnemyElementalInThisColSync = (field: Field) => {
        const enemyFields = field.parent.up!.fields

        if (enemyFields.length <= 1) {
            return null
        }

        return enemyFields[enemyFields.length - 2]
    }

    getFirstElementalFieldInThisColSync = (field: Field) => {
        const enemyFields = field.parent.up?.fields!

        if (enemyFields.length === 1) {
            return null
        }

        return enemyFields[0]
    }

    private highlightElemental = (field: Field | null, clickable?: boolean) => {
        if (field?.elemental) {
            this.highlightField(field, clickable)
        }
    }

    private highlightField = (field: Field | null, clickable?: boolean) => {
        if (field) {
            this.highlight(field, clickable, this.enabled)
        }
    }

    private getEnemyNeighBoors = (field: Field) => {
       return this.getNeighBoors(field.parent.up!)
    }

    private getNeighBoors = (node: MapNode) => {
        const enemyFields = [] as MapNode[]

        if (node.prev && node.prev.user) {
            enemyFields.push(node.prev)
        }

        if (node.next && node.next.user) {
            enemyFields.push(node.next)
        }

        return enemyFields
    }

    private getMyNeighBoors = (field: Field) => {
        return this.getNeighBoors(field.parent)
    }

    highlightNeighBoorEnemyFirstElemental = (field: Field, clickable?: boolean) => {
        this
            .getEnemyNeighBoors(field)
            .forEach(node => 
                this.highlightElemental(this.getFirstElementalInNode(node), clickable)
            )
    }

    getNeighBoorEnemyFirstElementalAsync = (field: Field) => {
        this.highlightNeighBoorEnemyFirstElemental(field, true)

        return this.formattedObserve()
    }

    private formattedObserve = () => {
        if (this.highlighted.values.length === 0) {
            return Promise.resolve(null)
        }

        return this.observe().then(data => data.target as Field)
    }

    getAllNeighBoorEnemyFirstElementalsSync = (field: Field) => {
       return this.getEnemyNeighBoors(field).map(this.getFirstElementalInNode).filter(f => f) as Field[]
    }

    transferElementalToNewField = (from: Field, to: Field) => {
        if (from.elemental && !to.elemental) {
            to.elemental = from.elemental
            from.delete()
        }
    }

    iterateThroughMyNodes = (cb: (node: MapNode) => void) => {
        if (this.startNode.next) {
            this.iterator.iterateThroughLine(this.startNode.next, cb, undefined, 'next', false)
        }
    }

    highlightMyElementalsByAny = (data: MobData, isEqual: (el: Elemental, data: MobData) => boolean, exceptions: Field[], clickable?: boolean) => {
        this.iterateThroughMyNodes(node => {
            node.fields.forEach(field => {
                if (field.elemental && isEqual(field.elemental, data) && !exceptions.includes(field)) {
                    this.highlightElemental(field, clickable)
                }
            })
        })
    }

    highLightMyElementalsByGuild = (data: MobData, exceptions: Field[], clickable?: boolean) => {
        this.highlightMyElementalsByAny(data, (el, data) => el.guild === data.guild, exceptions, clickable)
    }

    highlightMyElementalsByValue = (data: MobData, exceptions: Field[], clickable?: boolean) => {
        this.highlightMyElementalsByAny(data, (el, data) => el.maxHealth === data.value, exceptions, clickable)
    }

    getMyElementalsByValueAsync = (data: MobData, exceptions: Field[]) => {
        this.highlightMyElementalsByValue(data, exceptions, true)

        return this.formattedObserve()
    }

    getMyElementalByGuildAsync = (data: MobData, exceptions: Field[]) => {
        this.highLightMyElementalsByGuild(data, exceptions, true)

        return this.formattedObserve()
    }

    getLastFieldInNode = (node: MapNode) => {
        return node.fields[node.fields.length - 1]
    }

    getFirstElementalInNode = (node: MapNode) => {
        if (node.fields.length === 1) {
            return null
        }

        return node.fields[0]
    }

    private getFirstFieldInNode = (node: MapNode) => {
        return node.fields[0]
    }

    // private getLastElementalInNode = (node: MapNode) => {
    //     if (node.fields.length > 1) {
    //         return node.fields[node.fields.length - 2]
    //     }

    //     return null
    // }

    highlightMyAnyLastEmptyField = (field?: Field, clickable?: boolean) => {
        this.iterateThroughMyNodes(node => {
            if (field ? node !== field.parent : true) {
                this.highlightField(this.getLastFieldInNode(node), clickable)
            }
        })
    }

    getMyAnyLastEmptyFieldAsync = (field?: Field) => {
       this.highlightMyAnyLastEmptyField(field, true)

        return this.formattedObserve()
    }

    getEnemyFirstElementalsInThreeColsSync = (field: Field) => {
        const fields: (Field | null)[] = []

        const addFields = (node: MapNode) => {
            fields.push(this.getFirstElementalInNode(node))
        }

        addFields(field.parent)
        this.getNeighBoors(field.parent).forEach(addFields)

        return fields.filter(field => field) as Field[]
    }

    private getBeforeAfterElementalsSync = (field: Field, key: 'next' | 'prev') => {
        let currentField = field[key]
        const fields: Field[] = []

        if (field.elemental) {
            while (currentField && currentField.elemental) {
                fields.push(currentField)
                currentField = currentField[key]
            }
        }

        return fields 
    }

    getFieldsBeforeSync = (field: Field) => {
        return this.getBeforeAfterElementalsSync(field, 'prev')
    }

    getFieldAfterSync = (field: Field) => {
        return this.getBeforeAfterElementalsSync(field, 'next')
    }

    getMyNeighBoorLastEmptyFieldAsync = (field: Field | Field[]) => {
        this.highlightNeighBoorFields(field, true)

        return this.formattedObserve()
    }

    highlightNeighBoorFields = (field: Field | Field[], clickable?: boolean) => {
        if (Array.isArray(field)) {
            const highlightNeighBoor = (node: MapNode | null) => {
                if (node) {
                    this.highlightField(this.getFirstFieldInNode(node), clickable)
                }
            }
        
            highlightNeighBoor(field[0].parent.prev)
            highlightNeighBoor(field[field.length - 1].parent.next)
        } else {
            this.getMyNeighBoors(field).forEach(node => this.highlightField(this.getLastFieldInNode(node), clickable))
        }
    }

    highlightLastFieldInNode = (field: Field, clickable?: boolean) => {
        this.highlightField(this.getLastFieldInNode(field.parent), clickable)
    }

    getLastNeighBoorsAndCurrentAsync = (field: Field) => {
        this.highlightLastFieldInNode(field, true)
        this.highlightNeighBoorFields(field, true)

        return this.formattedObserve()
    }

    getMyLastFieldInThisNodeAsync = (field: Field) => {
        this.highlightLastFieldInNode(field, true)

        return this.formattedObserve()
    }

    highlightMyAnyElementalInThisNode = (field: Field, clickable?: boolean) => {
        field.parent.fields.forEach(field => field !== field && this.highlightElemental(field, clickable))
    }

    highlightEnemyAnyElementalInThisNode = (field: Field, clickable?: boolean) => {
        field.parent.up!.fields.forEach(f => this.highlightElemental(f, clickable))
     }

     getEnemyAnElementalInThisNode = (field: Field) => {
        this.highlightEnemyAnyElementalInThisNode(field, true)

        return this.formattedObserve()
     }

    getMyAnyElementalInThisNodeAsync = (field: Field) => {
       this.highlightMyAnyElementalInThisNode(field, true)

        return this.formattedObserve()
    }

    highlightMyAnyElemental = (field?: Field, clickable?: boolean) => {
        if (this.startNode.next) {
            this.iterateThroughMyNodes(node => {
                node.fields.forEach(f => f !== field && this.highlightElemental(f, clickable))
            })
        }
    }

    getMyAnyElementalAsync = (field?: Field) => {
        this.highlightMyAnyElemental(field, true)

        return this.formattedObserve()
    }

    getConcreteFieldAsync = (code: string) => {
        this.resolve({ target: this.getConcreteFieldSync(code), message: 'GET' })
    }

    iterateThroughAllNodes = (cb: (node: MapNode) => void) => {
        if (this.startNode.next) this.iterator.iterateThroughLine(this.startNode.next, cb, this.startNode, 'next', true)
    }

    getEnemyAllElementalsInThisNodeSync = (field: Field) => {
        return field.parent.up!.fields.filter(f => f.elemental)
    }

    getConcreteFieldSync = (code: string): Field | null => {
        const [userId, index] = code.split('_')
        let selectedField = null

        if (this.startNode.next) {
            this.iterator.iterateThroughLine(this.startNode.next, node => {
                if (node.user && node.user[0].id === userId && node.index === +index) {
                    selectedField = node.fields.find(field => field.code === code)
                }
            }, this.startNode, 'next', true)
        }

        return selectedField
    }

    getMyNodesInArray = () => {
        const arr: MapNode[] = []
        this.iterator.iterateThroughLine(this.startNode, node => arr.push(node))

        return arr
    }
}

export type Decks = {
    hand: string[]
    left: string[]
    deck: string[]
}

export class GameContentBuilder {
    userCards: Map<User, CardsController> = new Map<User, CardsController>()
    gameField: FieldsController = new FieldsController()
    private users: Turn

    constructor (users: Turn) {
        this.users = users
    }

    private createMob = (code: GuildCode, value: number): MobData => {
        return new MobData(GuildFactory.getInstance().create(code), value)
    }

    setGameFields = (controller: FieldsController) => {
        this.gameField = controller
    }

    private parseDeck = (decks: Decks) => {
        const controller = new CardsController()

        decks.deck.forEach(c => {
            const [code, value] = c.split('_')
            controller.cardsDeck.add(this.createMob(code as GuildCode, +value))
        })

        decks.left.forEach(c => {
            const [code, value] = c.split('_')
            controller.leftCardsDeck.add(this.createMob(code as GuildCode, +value))
        })

        decks.hand.forEach(c => {
            const [code, value] = c.split('_')
            controller.pushCardToHand(this.createMob(code as GuildCode, +value))
        })
        
        return controller
    }

    parseUserDecks = (decs: Map<User, Decks>) => {
        this.userCards = new Map<User, CardsController>()

        for (let entry of decs.entries()) {
            this.userCards.set(entry[0], this.parseDeck(entry[1]))
        }

        return this
    }

    formatInitDecks = (drafts: Map<User, UserDraft>) => {
        this.userCards = new Map<User, CardsController>()

        const VALUE_COUNT: Record<number, number> = {
            5: 4,
            6: 3,
            7: 2
        }

        for (let [user, draft] of drafts) {
            const controller = new CardsController()

            draft.chosen.forEach(guild => {
                Object.keys(VALUE_COUNT).forEach(key => {
                    const value = +key
                    const count = VALUE_COUNT[+key as keyof typeof VALUE_COUNT]
            
                    for (let i = 0; i < count; i++) {
                        controller.cardsDeck.add(new MobData(guild, value))
                    }
                })
            })

            controller.cardsDeck.shuffle()
            controller.replenishHandDeck()

            this.userCards.set(user, controller)
        }

        return this
    }

    addCardToCenter = () => {
        const playersCount = this.users.playersCount

        if (playersCount === 3) {
            let singlePlayer: User = this.users.teams.find(t => t.users.length === 1)!.users[0]

            this.gameField.iterateThroughAllNodes(node => {
                if (node.user && node.user[0] === singlePlayer && [1, 4].includes(node.index)) {
                    node.fields[0].createElemental(this.userCards.get(singlePlayer)!.cardsDeck.cards.pop()! )
                }
            })
        } else {
            const firstPlayer = this.users.firstTurnUser

            this.gameField.iterateThroughAllNodes(node => {
                if (node.user && node.user[0] === firstPlayer && node.index === (playersCount === 4 ? 1 : 2 )) {
                    node.fields[0].createElemental(this.userCards.get(firstPlayer)!.cardsDeck.cards.pop()! )
                }
            })
        }

        return this
    }

    parseUserFields = (usersFields: Map<User, string[][]>) => {
        this.gameField.iterateThroughAllNodes(node => {
            if (node.user) {
                const user = node.user[0]
                node.setFields([])
                node.addField()

                usersFields.get(user)![node.index]?.forEach(field => {
                    const [guild, value, health] = field.split('_')
                    node
                    .lastField!
                    .createElemental(this.createMob(guild as GuildCode, +value), +health)
                })
            }
        })

        return this
    }

    createGameField = (usersFields?: Map<User, string[][]>) => {
        const groups = this.users.groupedTeamsInRightOrder
        const countOfPlayers = this.users.playersCount

        const countFieldsPerPlayer: Record<number, number> = {
            3: 3,
            2: 5,
            4: 3
        } 

        const groupsLengths = groups.map(g => g.length)
        const maxGroupLength = Math.max(...groupsLengths)
        const minGroupLength = Math.min(...groupsLengths)

        const countFieldForCurrentCountPlayers = countFieldsPerPlayer[countOfPlayers] || 5
        const maxCountOfFieldsForGroup = maxGroupLength * countFieldForCurrentCountPlayers

        const startNode = this.gameField.startNode
        let lastNode: MapNode = startNode

        if (minGroupLength > 0) {
            groups.forEach((group, index, array) => {
                const countFieldsForUserOfGroup = group.length === maxGroupLength 
                    ? countFieldForCurrentCountPlayers
                    : Math.floor(maxCountOfFieldsForGroup / group.length)
    
                group.forEach((user) => {
                    for (let i = 0; i < countFieldsForUserOfGroup; i++) {
                        lastNode = lastNode.createNextNode(user, i)
                        
                        if (usersFields) {
                            usersFields.get(user[0])![i]?.forEach(field => {
                                const [guild, value, health] = field.split('_')
                             
                                lastNode
                                    .lastField!
                                    .createElemental(this.createMob(guild as GuildCode, +value), +health)
                            })
                        }
                    }
                })

                if (index !== array.length - 1) {
                    lastNode = lastNode.createNextNode()
                }
            })
    
            if (lastNode !== startNode) {
                startNode.prev = lastNode
                lastNode.next = startNode
            }

            let up = startNode
            let down = startNode
    
            for (let i = 0; i < maxCountOfFieldsForGroup; i++ ) {
                up = up.prev!
                down = down.next!
                up.down = down
                down.up = up
            }
        }

        return this
    }
}

export class UserDraft {
    banned: Set<Guild> = new Set<Guild>()
    chosen: Set<Guild> = new Set<Guild>()
    maxChosenCount: number = 4

    constructor(maxCount?: number) {
        this.maxChosenCount = maxCount || this.maxChosenCount
        makeAutoObservable(this)
    }

    setMaxCount = (value: number) => {
        this.maxChosenCount = value
    }

    get isDraftFull () {
        return this.chosen.size === this.maxChosenCount
    }

    ban = (guild: Guild) => {
        this.banned.add(guild)
    }

    setBanned = (guilds: Guild[]) => {
        guilds.forEach(g => this.banned.add(g))
    }

    setChosen = (guilds: Guild[]) => {
        guilds.forEach(g => this.chosen.add(g))
    }

    choose = (guild: Guild) => {
        if (!this.isDraftFull) {
            this.chosen.add(guild)
        }
    }
}

export class GuildsPoolController extends BaseController {
    guilds: GuildCard[] = []
    canRandom: boolean = false

    constructor() {
        super()
        makeObservable(this, {
            guilds: observable,
            setGuildsCards: action,
        })
    
    }

    takeRandomGuildAsync = () => {
        this.resolve({ target: this.takeRandomGuildCard(), message: 'random_guild' })
    }

    private takeRandomGuildCard = () => {
        const guildCard = this.guilds[Math.floor(Math.random() * (this.guilds.length - 1))]!
        this.deleteGuildCard(guildCard)

        return guildCard
    }

    takeRandomGuildSync() {
        return this.takeRandomGuildCard().guild
    }

    setGuildsCards = (cards: GuildCard[]) => {
        this.guilds = cards
    }

    private deleteGuildCard = (guildCard: GuildCard) => {
        this.setGuildsCards(this.guilds.filter(card => card !== guildCard))
    }

    setGuilds = (guilds: Guild[]) => {
        this.setGuildsCards(guilds.map(g => new GuildCard(g, this)))
    }

    private formattedObserve = () => {
        return this.observe().then(data => {
            this.deleteGuildCard(data.target as GuildCard)

            return (data.target as GuildCard).guild
        })
    }

    highlightGuilds = (clickable?: boolean) => {
        this.guilds.forEach(card => this.highlight(card, clickable))
    }

    getGuildAsync = () => {
        this.canRandom = true
        this.highlightGuilds(true)

        return this.formattedObserve()
    }

    getConcreteGuild = (code: string) => {
        const guild = this.guilds.find(card => card.guild.code === code)

        this.resolve({ target: guild, message: 'concrete_guild' })
    }

    resetHighlights = () => {
        this.canRandom = false
        super.resetHighlights()
    }
}

export class GuildCard extends SelectiveElement {
    readonly guild: Guild

    constructor(guild: Guild, mediator: Mediator) {
        super(mediator)
        this.guild = guild
    }
}

export type UserPicks = {
    bans: GuildCode[]
    picks: GuildCode[]
}

abstract class Stage {
    readonly code: GameStageCode
    protected stageController: GameStageController

    constructor (code: GameStageCode, controller: GameStageController) {
        this.code = code
        this.stageController = controller
    }

    setGameStageController = (controller: GameStageController) => {
        this.stageController = controller
    }

    abstract stop(): void
    abstract start(): void
}

export class Team {
    readonly id: string
    readonly name: string | undefined
    users: User[] = []

    constructor(id: string, users: User[], name?: string) {
        this.id = id
        this.name = name
        this.users = users
    }

    addUser = (u: User) => {
        this.users.push(u)
    }

    removeUser = (u: User) => {
        this.users = this.users.filter(user => user !== u)
    }
}

abstract class UsersStorage {
    readonly teams: Team[] = []
    readonly currentUser: User | null = null

    constructor(teams: Team[], currentUser?: User | null) {
        this.teams = teams
        this.currentUser = currentUser || this.currentUser
        makeObservable(this, {
            playersCount: computed,
            groupedTeamsInRightOrder: computed
        })
    }

    get playersCount () {
        return this.teams.reduce((acc, t) => acc + t.users.length, 0)
    }

    get groupedTeamsInRightOrder() {
        const foundTeam = this.currentUser ? this.teams.find(team => team.users.includes(this.currentUser!)) : undefined
        const currentTeam = foundTeam || this.teams[0]
        const currentTeamIndex = this.teams.indexOf(currentTeam)
        const currentUserIndex = foundTeam ? currentTeam.users.indexOf(this.currentUser!) : 0
        const grouped: UserTuple[][] = []

        this.iterateAround(this.teams, currentTeamIndex, (team, i) => {
            grouped.push([])
            this.iterateAround(team.users, currentUserIndex, user => {
                if (i % 2 === 0) {
                    grouped[i].push([user, team])
                } else {
                    grouped[i].unshift([user, team])
                }
            } )
        })

        return grouped
    }

    private iterateAround<T>(array: Array<T>, startIndex: number, cb: (el: T, index: number, currentElIndex: number) => void){
        const start = startIndex > array.length - 1 ? startIndex - array.length : startIndex
        for (let i = start; i < start + array.length; i++) {
            const currentIndex = i >= array.length ? i - array.length : i

            cb(array[currentIndex], i - start, currentIndex)
        }
    }

}

export class Turn extends UsersStorage {
    readonly usersOrder: UserTuple[]
    currentTurnIndex: number = 0 
    private firstTurnIndex: number = 0

    constructor(teams: Team[], currentUser?: User | null, firstTurn?: User) {
        super(teams, currentUser)
        makeObservable(this, {
            currentTurnIndex: observable,
            setTurn: action,
            next: action,
            setRandomTurn: action,
            firstTurnUser: computed,
            currentTurnTeam: computed,
            currentTurn: computed,
            isMyTurn: computed
        })

        const maxCountOfUserPerTeam = this.teams.reduce((acc, team) => Math.max(acc, team.users.length) ,0)
        this.usersOrder = []

        for (let i = 0; i < maxCountOfUserPerTeam; i++) {
            teams.forEach(team => this.usersOrder.push([team.users[i]
                 ? team.users[i]
                 : team.users[i - Math.floor(i / team.users.length) * team.users.length]
                , team]))
        }

        const foundUserTuple = firstTurn ? this.usersOrder.find(([u]) => u === firstTurn) : undefined
        const userIndex = foundUserTuple ? this.usersOrder.indexOf(foundUserTuple) : undefined
        const newIndex = userIndex ?? Math.floor(Math.random() * (this.playersCount - 1))
        this.currentTurnIndex = newIndex
        this.firstTurnIndex = newIndex
    }

    get firstTurnUser () {
        return this.usersOrder[this.firstTurnIndex][0]
    }

    setRandomTurn = () => {
        this.currentTurnIndex = Math.floor(Math.random() * this.usersOrder.length)
    }

    get currentTurnTeam () {
        return this.usersOrder[this.currentTurnIndex][1]
    }

    get currentTurn () {
        return this.usersOrder[this.currentTurnIndex][0]
    }

    setTurn = (turn: string) => {
        const foundUserOrder = this.usersOrder.find(u => u[0].id === turn)
        const user = foundUserOrder ? this.usersOrder.indexOf(foundUserOrder) : undefined

        if (user) {
            this.currentTurnIndex = user
        }
    }

    next() {
        this.currentTurnIndex = this.currentTurnIndex === this.usersOrder.length - 1
            ? 0
            : this.currentTurnIndex + 1
    }

    get isMyTurn() {
        return this.currentUser 
            ? this.currentTurn.id === this.currentUser.id
            : true
    }
}


// const incrementAroundArray = ()) => {

// }

// const decrementAroundArray = () => {

// }

export class PointsManager {
    private readonly maxPoints: number = 12
    points: Map<Team, number> = new Map<Team, number>()
    private readonly turn: Turn

    constructor (turn: Turn, maxPoints?: number) {
        this.maxPoints = maxPoints || this.maxPoints
        this.turn = turn

        for (let team of this.turn.teams) {
            this.points.set(team, 0)
        }
    }

    setPoints = (points: Map<Team, number>) => {
        this.points = points
    }

    addPointToOppositeTeam = (team: Team, value: number) => {
        if (this.turn.teams.length === 2) {
            const oppositeTeam = this.turn.teams[0] === team
                ? this.turn.teams[1]
                : this.turn.teams[0]

            this.addPoint(oppositeTeam, value)
        }
    }

    addPointToCurrentTurnPlayer = (value: number) => {
        this.addPoint(this.turn.currentTurnTeam, value)
    }

    addPoint = (team: Team, value: number) => {
        this.points.set(team, this.points.get(team)! + value)
    }
    
    get isEndOfTheGame () {
        let max = 0
        
        for (let point of this.points.values()) {
            max = Math.max(point, max)
        }

        return max >= this.maxPoints
    }
}

export type UsersCards = Map<User, CardsController>

export class Killer {
    private readonly points: PointsManager 
    private readonly usersCards: UsersCards

    constructor (userCards: UsersCards, points: PointsManager) {
        this.usersCards = userCards
        this.points = points
    }

    hit = (killer: Field | null, victim: Field | null, damage: number) => {
        if (killer && victim && killer.elemental && victim.elemental) {
            victim.elemental.hit(damage)

            if (victim.elemental.isDead) {
                const totalPoint = killer.elemental.guild.pointsForKill > 0
                    ? victim.elemental.guild.extraPointsForDeath + killer.elemental.guild.pointsForKill
                    : 0

                this.points.addPointToOppositeTeam(victim.parent.user![1], totalPoint)
                this.usersCards.get(victim.parent.user![0])?.leftCardsDeck.add(victim.elemental.mobData)
                victim.delete()
            }
        }
    }

    hitWithoutDeath = (killer: Field | null, victim: Field | null, damage: number) => {
        if (killer && victim && killer.elemental && victim.elemental) {
            victim.elemental.hit(damage)

            if (victim.elemental.isDead) {
                const totalPoint = killer.elemental.guild.pointsForKill > 0
                    ? victim.elemental.guild.extraPointsForDeath + killer.elemental.guild.pointsForKill
                    : 0

                this.points.addPointToOppositeTeam(victim.parent.user![1], totalPoint)
            }
        }
    }
}


export interface ActionStrategy {
    start(): void 
    stop(): void
    setController(controller: StrategyController): void 
}

export class Draw implements ActionStrategy {
    private readonly cardsController: CardsController
    private readonly fieldsController: FieldsController
    private readonly points: PointsManager
    private strategyController: StrategyController | null = null
    private turn: Turn 

    constructor (cards: CardsController, points: PointsManager, fieldsController: FieldsController, turn: Turn) {
        this.points = points
        this.cardsController = cards
        this.fieldsController = fieldsController
        this.turn = turn
    }

    setController(controller: StrategyController): void {
        this.strategyController = controller
    }

    start = () => {
        this.cardsController.replenishHandDeck()
        let countOfEmptyNodes = 0

        this.fieldsController.iterateThroughMyNodes(node => {
            const isControlledArea = node.user && node.user[0] === this.turn.currentTurn 
                && node.up && node.up.isEmpty && !node.isEmpty
            
            if (isControlledArea) {
                countOfEmptyNodes++            
            }
        })

        this.points.addPointToCurrentTurnPlayer(countOfEmptyNodes)
        this.strategyController && this.strategyController.stop()
    }

    stop = () => {
       this.strategyController?.stopImmediately()
    }
}

export  type GameStrategyCodeType = 'DRAW' | 'ACTIVATE' | 'SPAWN'

export abstract class SequentialStrategy implements ActionStrategy {
    readonly data: MobData
    abstract code: GameStrategyCodeType
    protected readonly interactedFields: Field[] = []
    protected readonly cardsController: CardsController
    protected readonly fieldsController: FieldsController
    protected readonly killer: Killer
    protected readonly MAX_COUNT_CARD: number = 3
    protected activeGuild: Guild | null = null
    protected activeValue: number | null = null
    protected response: null | Function = null
    protected canChoose: boolean = false
    protected strategyController: StrategyController | null = null

    constructor (cards: CardsController, killer: Killer, fieldsController: FieldsController, data: MobData) {
        this.killer = killer
        this.cardsController = cards
        this.fieldsController = fieldsController
        this.data = data 
    }

    setController = (controller: StrategyController) => {
        this.strategyController = controller
    }

    abstract startAction(): void

    chooseGuild = () => {
        this.activeGuild = this.data.guild

        this.startAction()
    }
    abstract highlightByValue (): void
    abstract highlightByGuild (): void

    resetHighlights = () => {
        this.cardsController.resetHighlights()
        this.fieldsController.resetHighlights()
    }

    chooseValue = () => {
        this.activeValue = this.data.value

        this.startAction()
    }

    start(): void {
        this.canChoose = true
    }

    decline = () => {
        this.cardsController.reset()
        this.fieldsController.reset()
        this.strategyController?.stopImmediately(false)
    }

    stop = () => {
        this.cardsController.reset()
        this.fieldsController.reset()
        this.strategyController?.stopImmediately()
    }
}


export class Spawn extends SequentialStrategy {
    code: GameStrategyCodeType = 'SPAWN'

    startAction = async () => {
        for (let i = 0; i < Math.max(this.MAX_COUNT_CARD, this.cardsController.handCardDeck.cards.length); i++) {
            let data: MobData | null = null

            if (this.activeValue) {
                data = await this.cardsController.getCardsSameValueAsync(this.activeValue)
            } else if (this.activeGuild) {
                data = await this.cardsController.getCardsSameGuildAsync(this.activeGuild)
            }

            if (data) {
                let field: Field | null

                if (i === 0) {
                    field = await this.fieldsController.getMyAnyLastEmptyFieldAsync()
                } else if (i === 1) {
                    field = await this.fieldsController.getLastNeighBoorsAndCurrentAsync(this.interactedFields[0])
                } else {
                    field = await this.fieldsController.getMyNeighBoorLastEmptyFieldAsync(this.interactedFields)
                }

                if (field) {
                    field!.createElemental(data) 
                    await field!.elemental?.guild.spawn(field!, this.fieldsController, this.killer, this.cardsController,)
                    this.interactedFields.push(field!)
                }
            }
        }

        this.stop()
    }

    highlightByGuild(): void {
        this.cardsController.highlightCardsSameGuild(this.data.guild)
    }

    highlightByValue(): void {
        this.cardsController.highlightCardsByValue(this.data.value)
    }
}

export class Activation extends SequentialStrategy {
    code: GameStrategyCodeType = 'ACTIVATE'
    startAction = async () => {
        this.cardsController.moveCardFromHandToLeft(this.data)
        let countOfAvailableCards = 0

        if (this.activeValue !== null) {
            this.fieldsController.highLightMyElementalsByGuild(this.data, [], false)
        } else {
            this.fieldsController.highlightMyElementalsByValue(this.data, [], false)
        }

        countOfAvailableCards = this.fieldsController.highlighted.size
        this.fieldsController.resetHighlights()

        for (let i = 0; i < Math.min(this.MAX_COUNT_CARD, countOfAvailableCards); i++) {
            let field: Field | null

            if (this.activeValue !== null) {
                field = await this.fieldsController.getMyElementalsByValueAsync(this.data, this.interactedFields)
            } else {
                field = await this.fieldsController.getMyElementalByGuildAsync(this.data, this.interactedFields)
            }
    
            if (field) {
                await field!.elemental?.guild.activate(field!, this.fieldsController, this.killer, this.cardsController,)
                this.interactedFields.push(field)
            }
        }

        this.stop()
    }

    highlightByGuild(): void {
        this.fieldsController.highLightMyElementalsByGuild(this.data, [])
    }

    highlightByValue(): void {
        this.fieldsController.highlightMyElementalsByValue(this.data, [])
    }
}

export type DraftStage  = 'ban' | 'pick'

type DraftConfig = Partial<{
    withExtension: boolean
    withBan: boolean
    draftTemplates: DraftStage[]
    guildsPerPlayer: number
}>

export class Draft extends Stage {
    guilds: GuildsPoolController
    readonly turn: Turn
    private readonly stagesTemplate: DraftStage[] = []
    private currentStageIndex: number = 0
    usersDraft: Map<User, UserDraft> 
    private stopped: boolean = false

    constructor(turn: Turn, controller: GameStageController, config?: DraftConfig) {
        super('DRAFT', controller)
        makeObservable(this, {

        })
        this.stagesTemplate = config?.draftTemplates || ['pick']
        this.turn= turn
        const builder = new DraftContentBuilder(turn)

        builder
            .formatGuildsPool(config?.withBan || false, config?.withExtension || false)
            .setMaxCountOfGuildsPerUser(config?.guildsPerPlayer)
            
        this.guilds = builder.guilds
        this.usersDraft = builder.usersDraft
    }

    currentUserDraft = () => {
        return this.getDraftByUser(this.turn.currentTurn)
    }

    getDraftByUser = (user: User) => {
        return this.usersDraft.get(user)!
    }

    nextStage = () => {
        this.currentStageIndex = this.currentStageIndex === this.stagesTemplate.length - 1
            ? 0
            : this.currentStageIndex + 1
    }

    get currentStage() {
        return this.stagesTemplate.length === 0
            ? 'pick'
            : this.stagesTemplate[this.currentStageIndex]
    }

    setRandomDrafts = () => {
        while(!this.isEnd()) {
            this.currentUserDraft().choose(this.guilds.takeRandomGuildSync())
            this.turn.next()
        } 

        this.stageController.syncState()
    }

    isEnd = () => {
        let isEnd = true

        for (let draft  of this.usersDraft.values()) {
            isEnd = draft.isDraftFull
        }

        return isEnd || this.stopped
    }

    pause = () => {
        this.stopped = true
    }

    stop = () => {
        this.stageController.setGameStage(new GameProcess(this.turn, this.stageController, this.usersDraft), true)
    }

    processIterate = async () => {
        const guild = await this.guilds.getGuildAsync()

        if (this.currentStage === 'pick') {
            this.currentUserDraft().choose(guild)
        } else {
            this.currentUserDraft().ban(guild)
        }

        this.turn.next()
    }

    start = async() => {
        this.stopped = false

        while (!this.isEnd()) {
            await this.processIterate()
        }

        this.stageController.syncState()
        this.stop()
    }
}


export class DraftContentBuilder {
    usersDraft: Map<User, UserDraft> = new Map<User, UserDraft>()
    guilds: GuildsPoolController = new GuildsPoolController()
    draftStages: DraftStage[] = ['pick']
    private users: UsersStorage

    constructor(users: UsersStorage) {
        this.users = users
        this.formatGuildDrafts()
    }

    parseUserDrafts = (data: Map<User, UserPicks>) => {
        for (let [user, picks] of data.entries()) {
            const draft = new UserDraft()

            draft.setBanned(this.getGuildSet(picks.bans))
            draft.setChosen(this.getGuildSet(picks.picks))

            this.usersDraft.set(user, draft)
        }

        return this
    }

    parseGuildsPool = (guilds: GuildCode[]) => {
        this.guilds.setGuilds(this.getGuildSet(guilds))

        return this
    }

    formatGuildsPool = (withBan: boolean, withExtension: boolean) => {
        const playersCount = this.users.playersCount
        const needExtension = playersCount > 2 || withExtension || withBan
        const initPool: GuildCode[] = shuffleArray([...BASE_GUILDS_CODE, ...needExtension ? ADD_GUILDS : []])
        const finalPool = withBan ? initPool : initPool.slice(0, playersCount * 2 + 6)
        this.guilds.setGuilds(this.getGuildSet(finalPool))

        return this
    }

    addUsersRandomGuild = (count: number = 1) => {
        const teams = this.users.teams

        for (let i = 0; i < (count); i++) {
            teams.forEach(team => {
                team.users.forEach(user => {
                    this.usersDraft
                        .get(user)!
                        .choose(this.guilds.takeRandomGuildSync())
                })
            })
        }

        return this
    }

    setMaxCountOfGuildsPerUser = (maxGuildsCountPerPlayer?: number) => {
        const leftGuildsPerStage = this.maxCountPlayersPerTeam * this.users.teams.length
        const countOfBanStagesPerRound = this.draftStages.reduce((acc, stage) => stage === 'ban' ? acc + 1 : acc ,0)
        const countOfBanGuildsPerRound = countOfBanStagesPerRound * leftGuildsPerStage
        const countOfLeftGuildsPerRound = this.draftStages.length * leftGuildsPerStage
        const countOfRounds = Math.floor(this.guilds.guilds.length / countOfLeftGuildsPerRound)
        const totalCountOfBannedGuilds = countOfRounds * countOfBanGuildsPerRound
        const availableCountOfGuildForChoose = this.guilds.guilds.length - totalCountOfBannedGuilds
        const maxCountOfChosenGuildsPerTeam = Math.floor(availableCountOfGuildForChoose / this.users.teams.length)
        const maxCountOfChosenGuildsPerPlayer = Math.floor(maxCountOfChosenGuildsPerTeam / this.maxCountPlayersPerTeam)
        const countOfGuildsPerPlayer = maxGuildsCountPerPlayer
            ? Math.min(maxCountOfChosenGuildsPerPlayer, maxGuildsCountPerPlayer)
            : maxCountOfChosenGuildsPerTeam

        this.users.teams.forEach(team => {
            team.users.forEach(user => {
                this.usersDraft.get(user)?.setMaxCount(this.maxCountPlayersPerTeam / team.users.length * countOfGuildsPerPlayer)
            })
        })

        return this
    }

    formatGuildDrafts = () => {
        this.usersDraft = new Map<User, UserDraft>()

        this.users.teams.forEach(team => {
            team.users.forEach(user => {
                this.usersDraft.set(user, new UserDraft())
            })
        })

        return this
    }

    formatDraftStages = (withBan: boolean, minGuildsCountPerPlayer?: number, template?: DraftStage[]) => {
        if (template &&  this.checkDraftTemplate(template, minGuildsCountPerPlayer)) {
           this.draftStages = template
        } else {
            this.draftStages = withBan ? ['pick', 'ban'] : ['pick']
        }

        return  this
    }

    get maxCountPlayersPerTeam () {
       return this.users.teams.reduce((acc, t) => Math.max(t.users.length, acc), 0)
    }

    checkDraftTemplate = (template: DraftStage[], minCountOfGuildsPerPlayer?: number) => {
        let countOfGuilds = this.guilds.guilds.length
        let countChosenGuildsPerPlayer = 0
        const leftGuildsPerStage = this.maxCountPlayersPerTeam * this.users.teams.length
        const leftGuildsPerTemplateStages = template.length * leftGuildsPerStage

        if (template.length > 0) {
            while (countOfGuilds > 0 && countOfGuilds >= leftGuildsPerTemplateStages ) {
                template.forEach(stage => {
                    if (stage === 'pick') {
                        countChosenGuildsPerPlayer++
                    }
                    countOfGuilds = countOfGuilds - leftGuildsPerStage
                })
            }
        }

        return countOfGuilds >= 0 && countChosenGuildsPerPlayer >= (minCountOfGuildsPerPlayer || 1)
    }

    private getGuildSet = (codes: GuildCode[]) => {
        return GuildFactory.getInstance().createSeveral(codes)
    }
}

const shuffleArray = (array: any[]) => {
    const copy = [...array]

    copy.forEach((_, index, arr) => {
        const j = Math.floor(Math.random() * (index + 1));
        [arr[index], arr[j]] = [arr[j], arr[index]]
    });

    return copy
}


interface StrategyController {
    setStrategy(strategy: ActionStrategy | null): void
    stop(): void 
    stopImmediately: (value?: boolean) => void
}

class ActionController implements StrategyController {
    strategy: ActionStrategy | null = null
    stopImmediately = (_?: boolean) => {}


    setStrategy = (strategy: ActionStrategy | null) => {
        this.strategy = strategy

        if (this.strategy) {
            this.strategy.setController(this)
        }   
    }

    start = async () => {
        if (this.strategy) {
            this.strategy.start()
            return new Promise((res) => {
                this.stopImmediately = res
            }).then((res) => {
                this.stopImmediately = (_?: boolean) => {}
                this.strategy = null
                return res ?? true
            })
        }
    }

    stop = () => {
        if (this.strategy) {
            this.stopImmediately()
        }
    }

    get hasStrategy () {
        return !!this.strategy
    }
}

export class GameRoom extends Stage {
    teams: Team[] = []
    maxPlayers: number = 2

    constructor (controller: GameStageController) {
        super('ROOM', controller)
    }

    start(): void {
        
    }

    stop(): void {
        
    }

    get maxPlayersPerTeam () {
        return Math.ceil(this.maxPlayers / 2)
    }

    get currentCountOfPlayers () {
        return this.teams.reduce((acc, t) => acc + t.users.length, 0)
    }

    addUserToTeam = (user: User, teamId: string) => {
        const foundTeam = this.teams.find(t => t.id === teamId)

        if (foundTeam && foundTeam.users.length < this.maxPlayersPerTeam && this.currentCountOfPlayers < this.maxPlayers) {
            foundTeam.addUser(user)
        }     
    }

}

export class GameEnd extends Stage {
    constructor (controller: GameStageController) {
        super('END', controller)
    }

    start(): void {
        
    }

    stop(): void {
        
    }

    restart = () => {
        // this.stageController.setGameStage()
    }

    goToRoomMenu = () => {
        // this.stageController.setGameStage()
    }
}

export class GameProcess extends Stage {
    turn: Turn
    points: PointsManager
    gameField: FieldsController
    private killer: Killer
    usersCards: UsersCards
    action: ActionController = new ActionController()
    private stopped: boolean = false

    constructor(turn: Turn, controller: GameStageController, drafts?: Map<User, UserDraft>) {
        super('GAME', controller)
        this.turn = turn
        this.points = new PointsManager(turn)
        const builder = new GameContentBuilder(turn)

        if (drafts && turn.isMyTurn) {
            builder
                .createGameField()
                .formatInitDecks(drafts)
                .addCardToCenter()
        } 

        this.gameField = builder.gameField
        this.usersCards = builder.userCards
        this.killer = new Killer(this.usersCards, this.points)
        this.stageController.stopLoading()
    }

    currentDeck = () => {
        return this.getCertainUserDeck(this.turn.currentTurn)!
    }

    stop() {
        this.stopped = true
        this.stageController.setGameStage(new GameEnd(this.stageController))
    }

    isEnd = () => {
        return this.points.isEndOfTheGame || this.stopped
    }

    start = async() => {
        while (!this.isEnd()) {
            if (this.turn.isMyTurn) {
                this.gameField.setEnabled(true)
                this.currentDeck().setEnabled(true)
                await this.interactWithCard()
                this.turn.next()
                this.stageController.syncState()
            } else {
                this.gameField.setEnabled(false)
                this.currentDeck().setEnabled(false)
            }
        }

        this.stop()
    }

    private getCertainUserDeck = (user: User): CardsController => {
        return this.usersCards.get(user)!
    }

    setStrategy = (strategy: ActionStrategy | null) => {
        this.action.setStrategy(strategy)
    }

    setActivation = (mobData: MobData) => {
        this.setStrategy(new Activation(this.currentDeck(), this.killer, this.gameField, mobData))
    }

    setDraw = () => {
        this.setStrategy(new Draw(this.currentDeck(), this.points, this.gameField, this.turn))
    }

    setSpawn = (mobData: MobData) => {
        this.setStrategy(new Spawn(this.currentDeck(), this.killer, this.gameField, mobData))
    }

    interactWithCard = async () => {
        do {
            const { message, target } = await this.currentDeck().getSomeCardCommand()!
            debugger
            switch (message) {
                case CardsActionMessages.activate:
                    this.setActivation(target)
                    break
                case CardsActionMessages.summon:
                    this.setSpawn(target)
                    break
                case CardsActionMessages.draw:
                    this.setDraw()
                    break
            }
    
            await this.action.start().catch(this.interactWithCard)
        } while (await this.action.start())
        return
    }
}

type Log = {
    user: string
    action: string
    target: string
    extra: Log[]
}

export type GameStageCode = 'DRAFT' | 'GAME' | 'END' | 'ROOM'
export type State = {
    turn: string
    userDecks: Decks 
    users: {
        guilds: UserPicks
        fields: string[][]
    }[]
    points: {
        team: string
        count: number
    }[]
}

interface GameAPI extends ChatAPI {
    logAction(l: Log): void
    getLog(): Log
    setState(state: State): void
    getState(): State
    connect(): {
        stage: GameStageCode
        turn: string
        teams: {
            id: string
            name: string
            users: {
                id: string
                name: string
            }[]
        }[]
    }
}

// class GameWebsocketAPI implements GameAPI {
//     static instance: GameWebsocketAPI
//     private path = ''
//     private socket: ReturnType<typeof io>

//     constructor () {
//         this.socket = io(this.path)
//     }

//     static getInstance = () => {
//         if (!this.instance) {
//             this.instance = new GameWebsocketAPI()
//         }
        
//         return this.instance
//     }


//     logAction = (l: Log): void => {
        
//     }

//     getLog(): Log {
        
//     }

//     setState(state: State): void {
        
//     }

//     getState() {
        
//     }

//     connect = () => {
        
//     }
// }

export interface GameStageController {
    setGameStage(stage: Stage, preloading?: boolean): void
    syncState(): void
    stopLoading(): void
    startLoading(): void
}

export class GameState implements GameStageController {
    currentStage: Stage | null  = null
    turn: Turn
    initialized: boolean = false
    api: GameAPI | null = null
    chat: Chat
    loading: boolean = false

    constructor (teams?: Team[], currentUser?: User | null, api?: GameAPI) {
        this.turn = new Turn(teams || [], currentUser)
        this.currentStage = new Draft(this.turn, this)
        this.currentStage.start()
        this.api = api || null
        this.chat = new Chat(api)
        makeAutoObservable(this)
    }

    setApi = (api: GameAPI) => {
        this.api = api
        this.chat.setApi(api)
    }
    stopLoading(): void {
        this.loading = false
    }

    startLoading(): void {
        this.loading = true
    }

    setGameStage = (stage: Stage, preloading?: boolean) => {
        this.currentStage = stage
        this.currentStage.start()
        this.loading = !!preloading
    }

    initialize = () => {
        this.initialized = true
    }

    syncState() {

    }

    onConnect() {
         
    }

    onReconnect() {

    }

    onDisconnect() {

    }
}


// interface Syncronizer {
//     syncServerWithLocal(): void
//     syncLocalWithServer(): void
// }

// class DraftSyncronizer implements Syncronizer {
//     syncLocalWithServer(): void {
        
//     }

//     syncServerWithLocal(): void {
        
//     }
// }

// class EndSyncronizer implements Syncronizer {
//     syncLocalWithServer(): void {
        
//     }

//     syncServerWithLocal(): void {
        
//     }
// }

// class GameProcessSyncronizer implements Syncronizer {
//     syncLocalWithServer(): void {
        
//     }

//     syncServerWithLocal(): void {
        
//     }
// }

interface ChatController {
    deleteMessage(m: Message): void
    deleteMessageLocally(me: Message): void
    editMessage(m: Message): void
    repeatMessageRequest(m: Message): void
}

export interface ChatAPI {
    sendChatMessage(m: Message): Promise<void>
    editChatMessage(m: Message):  Promise<void>
    deleteChatMessage(m: Message):  Promise<void>
    getLastMessage(): Promise<Message>
    getMessages(): Promise<Message[]>
}


export class Chat implements ChatController {
    private api: ChatAPI | null = null
    messages: Message[] = []
    lastMessagesFailedOperations: Map<Message, Function> = new Map()

    constructor(api?: ChatAPI) {
        this.api = api || null
    }

    deleteMessageLocally = (message: Message) => {
        this.messages = this.messages.filter(m => m !== message)
    }

    deleteMessage = (m: Message) => {
        this.messageProcess(m, this.api?.deleteChatMessage, () => this.deleteMessageLocally(m))
    }

    repeatMessageRequest(m: Message): void {
        const lastFailedOperation = this.lastMessagesFailedOperations.get(m)

        if (lastFailedOperation) {
            lastFailedOperation()
        }
    }

    private messageProcess = async (message: Message, asyncAction?: (m: Message) => Promise<void>, onSuccess?: Function, onError?: Function) => {
        try {
            message.setLoading(true)
            if (asyncAction) {
                await asyncAction(message)
            }
            onSuccess && onSuccess()
            message.setLoading(false)
            this.lastMessagesFailedOperations.delete(message)
        } catch (e) {
            onError && onError()
            this.lastMessagesFailedOperations.set(message, () => {
                this.messageProcess(message, asyncAction, onSuccess, onError)
            })
            message.setHasError(true)
            message.setLoading(false)
        }
    }

    editMessage = (message: Message) => {
        this.messageProcess(message, this.api?.editChatMessage)
    }

    setMessages = (messages: Message[]) => {
        this.messages = messages
    }

    addMessage = (message: Message) => {
        message.setController(this)
        this.messages.push(message)
    }

    sendMessage = async (data: string, flag?: string) => {
        const message = new Message(data, flag)
        this.addMessage(message)
        this.messageProcess(message, this.api?.sendChatMessage, message.mount)
    }

    setApi = (api: ChatAPI | null) => {
        this.api = api
    }
}

export class Message {
    readonly code: string
    data: string
    edited: boolean = false
    hasError: boolean = false
    controller: ChatController | null = null
    loading: boolean = false
    mounted: boolean = false
    flag?: string
    
    constructor(data: string, flag?: string, id?: string,) {
        this.data = data
        this.code = id || uuid()
        this.flag = flag
    }

    setController = (controller: ChatController) => {
        this.controller = controller
    }

    delete = () => {
        if (this.controller) {
            if (this.mounted) {
                this.controller.deleteMessage(this)
            } else {
                this.controller.deleteMessageLocally(this)
            }
        }
    }

    edit = (data: string) => {
        this.data = data
        this.controller && this.controller.editMessage(this)
    }

    setHasError = (value: boolean) => {
        this.hasError = value
    }

    setLoading = (value: boolean) => {
        this.loading = value
    }

    repeatRequest = () => {
        if (this.controller && this.hasError) {
            this.controller.repeatMessageRequest(this)
        }
    }

    mount = () => {
        this.mounted = true
    }
}


