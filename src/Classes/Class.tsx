import { action, computed, makeAutoObservable, makeObservable, observable } from 'mobx'
// @ts-ignore
import { v4 as uuid } from 'uuid'
import { io } from 'socket.io-client'
import { ServerRoomPropsPayload } from '../features/rooms'
import { DraftStage, HTTPAxiosAPI, ValidationField, RoomType, NotificationService, NotificationType, NotificationVariant } from '../shared'
import * as yup from 'yup'
import { AuthUserController } from '../features/auth/model/store'
import { DeckMapper, ElementalMapper, CardsControllerMapper, UserDraftMapper, UserMapper, GameRoomPropsMapper, GuildsPoolMapper, FieldsControllerMapper, RoomTeamMapper } from './Mapper'
import { BASE_GUILDS_CODE, ADD_GUILDS, LS_PLAYED_GAMES_KEY, WEBSOCKET_SERVER_PATH } from './constants'
import { GuildCode, MobDataCode, UserTuple, MapNodeCode, MapNodeWithUserCode, 
    NodeNeighbors, ElementalCode, FullFieldCode, Command,
     LogAction, ServerGameState, ServerFinalState, ServerUserFields,
      ServerUserCards, ServerTeamPoints, ServerUserDrafts,
      ServerUserDecks, LogPayload, UsersCards, LogInstigatorType,
       ServerUserPicks, DraftConfig, DefaultPicks, DefaultProcessGameState,
        PrevState, Log, LogSideEffect, CommandFormatter, HighlightElementConfig,
         HighlightElementConfigForGetActions, CardWithoutResultHandler, 
         EqualFunction, FieldHandler, FieldHandlerWithNoResult, 
         GameProcessUpdateAllStatePayload, DraftUpdateAllStatePayload,
          NextTurnSideEffect, GameStrategyCodeType, StrategyController, 
          TimerChangeTimeSideEffect, ChatAPI, 
          ChatController, IGameAPI, IInGameStageController, IStageController,
           InGameCode, InGameStageControllerDefaultData, InteractionType,
            LogReader, Mediator, StageCode, UserType, LogInstigator, GameType, ILoggingGameAPI, ISyncGameAPI, GameStatePayload, WebsocketEvents, RedisState, PlayedGame, WEBSOCKET_EVENTS, ServerUser } from './namespace'
import { privateApi } from '../shared/api/jwt.api'



const getRandomElement = (array: any[]) => {
    return array [Math.floor(Math.random() * (array.length - 1))]!
}


export class SelectiveElement {
    available: boolean = true
    clickable: boolean = false
    protected mediator: Mediator
    highlighted: boolean = false

    constructor (mediator: Mediator) {
        this.mediator = mediator
        
        makeObservable(this, {
            available: observable,
            highlighted: observable,
            setAvailable: action,
            highlight: action,
        })
    }

    select = () => this.interact('select')
    onSelect = () => this.handleInteract(this.select)

    setAvailable = (value: boolean) => {
        this.available = value
    } 

    setClickable = (status: boolean) => {
        this.clickable = status
    }

    setHighlighted = (status: boolean) => {
        this.highlighted = status
    }

    highlight = (status: boolean, available: boolean, clickable: boolean) => {
        this.setHighlighted(status)
        this.setAvailable(available)
        this.setClickable(clickable)
    }

    interact = (message: string, extra?: unknown) => {
        if (this.available) {
            this.mediator.notify(this, message || 'click', extra)
        }
    }

    handleInteract = (cb: Function) => {
        if (this.clickable && this.available) {
            cb()
        }
    }
}

export abstract class Guild {
    abstract readonly action: string[]
    readonly code: GuildCode
    abstract readonly name: string
    abstract readonly icon: string 
    abstract readonly color: string
    readonly extraPointsForDeath: number = 0
    readonly pointsForKill: number = 1

    constructor (code: GuildCode) {
        this.code = code
    }

    spawn = (_: Field, __: FieldsController, ___: Killer, ____: CardsController, onFinish: Function) => {
        onFinish()
    }
   
    abstract activate (field: Field, fields: FieldsController, killer: Killer, cards: CardsController, onFinish: Function): void

    protected attackFirstInCol = (field: Field, fields: FieldsController, killer: Killer, damage: number) => {
        const elemental = fields.getFirstEnemyElementalFieldInThisColSync(field)

        if (elemental) {
            killer.hit(field, elemental, damage)
        }
    }

    protected transferToAny = (field: Field, fields: FieldsController, cb: FieldHandler) => {
        fields.getTeamAnyLastEmptyFieldAsync(field.parent.user![1], [field.parent], newPlace => {
            fields.transferElementalToNewField(field, newPlace!)
            cb(newPlace)
        })
    }

    protected transferToNeighbors = (field: Field, fields: FieldsController, cb: FieldHandler) => {
        fields.getNeighBoorLastEmptyFieldAsync(field, newPlace => {
            fields.transferElementalToNewField(field, newPlace!)
            cb(newPlace)
        })
    } 
}

export class IceGuild extends Guild {
    readonly action = ['Если последнему врагу в этой лоакции уже нанесен хотя бы 1 урон, нанесите ему 4 урон', 'В ином случае нанесите ему 1 урон'] 
    readonly name: string = 'Лед'
    readonly icon: string = ''
    readonly color: string = 'blue-200'

    activate = (field: Field, fields: FieldsController, killer: Killer, _: CardsController, onFinish: Function) => {
        const elemental = fields.getLastEnemyElementalInThisColSync(field)
        if (elemental) {
            const damage =elemental.elemental!.health < elemental.elemental!.maxHealth ? 4 : 1
            killer.hit(field, elemental, damage)
        }

        onFinish()
    }
}

export class LightGuild extends Guild {
    readonly action = ['Нанесите 2 урона первому врагу в этой локации.', 'Снимите 1 урон с активированного элементаля Света или с любого другого союзника'] 
    readonly name: string = 'Свет'
    readonly icon: string = ''
    readonly color: string = 'yellow-400'

    activate = (field: Field, fields: FieldsController, killer: Killer, _: CardsController, onFinish: Function) => {
        this.attackFirstInCol(field, fields, killer, 2);
    
        fields.getTeamAnyElementalAsync(field.parent.user![1], [], field => {
            if (field) {
                field.elemental!.heal(1)
            }

            onFinish()
        })
    }
}

export class FireGuild extends Guild {
    readonly action = ['Нанесите 3 урона первому врагу в этой локации.', 'Нанесите 1 урон союзнику, который выложен сразу за этим элменталем огня'] 
    readonly name: string = 'Огонь'
    readonly icon: string = ''
    readonly color: string = 'red-500'

    activate = (field: Field, fields: FieldsController, killer: Killer, _: CardsController, onFinish: Function) => {
        this.attackFirstInCol(field, fields, killer, 3)

        if (field.next && field.next.elemental) {
            killer.hit(field, field.next, 1)
        }

        onFinish()
    }
}

export class CrystalGuild extends Guild {
    readonly action = ['Нанесите 4 урона первому врагу в этой локации. Когда элементаль кристалл уничтожается, соперник получает на 1 очко энергии больше']
    readonly name: string = 'Кристал'
    readonly icon: string = ''
    readonly color: string = 'indigo-100'
    readonly extraPointsForDeath: number = 1

    activate = (field: Field, fields: FieldsController, killer: Killer, _: CardsController, onFinish: Function) => {
        this.attackFirstInCol(field, fields, killer, 4)

        onFinish()
    }
}

export class WaterGuild extends Guild {
    readonly action = ['Нанесите 2 урона первому врагу в этой локации', 'Переместите этого элменталя Воды в соседнюю локацию.', 'Нанесите 1 урон первому врагу в новой локации' ]  
    readonly name: string = 'Вода'
    readonly icon: string = ''
    readonly color: string = 'blue-400'

    activate = (field: Field, fields: FieldsController, killer: Killer, _: CardsController, onFinish: Function) => {
        this.attackFirstInCol(field, fields, killer, 2)
        this.transferToNeighbors(field, fields, newPlace => {
            this.attackFirstInCol(newPlace!, fields, killer, 1)
            onFinish()
        })
    }
}

export class AirGuild extends Guild {
    readonly action = ['Переместите этого элменталя Воздуха в любую другую локацию.', 'Нанесите 1 урон первому врагу в новой локации, а также обеих соседних']  
    readonly name: string = 'Воздух'
    readonly icon: string = ''
    readonly color: string = 'grey-200'

    activate = (field: Field, fields: FieldsController, killer: Killer, _: CardsController, onFinish: Function) => {
       this.transferToAny(field, fields, newPlace => {
            fields.getEnemyFirstElementalsInThreeColsSync(newPlace!).forEach(f => {
                killer.hit(newPlace, f, 1)
            })
            onFinish()
       })
    }
}

export class DarkGuild extends Guild {
    readonly action = ['Переместите этого элементаля Тьмы в другую локацию.', 'Нанесите 1 урон первому врагу в этой локации. Если после этого враг уничтожен, получите на 1 очко энергии больше']
    readonly name: string = 'Тьма'
    readonly icon: string = ''
    readonly color: string = 'grey-800'
    readonly pointsForKill: number = 2

    activate = (field: Field, fields: FieldsController, killer: Killer, _: CardsController, onFinish: Function) => {
        this.transferToAny(field, fields, newPlace => {
            this.attackFirstInCol(newPlace, fields, killer, 1)
            onFinish()
        })
    }
}

export class FloraGuild extends Guild {
    readonly action = ['Нанесите 2 урона первому врагу в соседней локации', 'Переместите данного врага в локацию, где находится этот элементаль Флоры']
    readonly name: string = 'Флора'
    readonly icon: string = ''
    readonly color: string = 'green-500'

    activate = (field: Field, fields: FieldsController, killer: Killer, _: CardsController, onFinish: Function) => {
        fields.getNeighBoorEnemyFirstElementalAsync(field, neighboor => {
            if (neighboor) {
                killer.hit(field, neighboor, 2)
    
                fields.transferElementalToNewField(neighboor, fields.getLastFieldInNode(field.parent.up!))
            }

            onFinish()
        })
    }
}

export class LightingGuild extends Guild {
    readonly action = ['Нанесите 2 урона любому врагу в этой локации', 'Если при этом элменталь Молнии уничтожает врага, тут же воспользуйтесь этой способностью еще раз']
    readonly name: string = 'Молния'
    readonly icon: string = ''
    readonly color: string = 'indigo-600'

    activate = (field: Field, fields: FieldsController, killer: Killer, _: CardsController, onFinish: Function) => {
        const iterate = () => {
            fields.getEnemyAnyElementalInThisNodeAsync(field, enemy => {
                if (enemy) {
                    const damage = 2
                    const previousHealth = enemy.elemental!.health
                    killer.hit(field, enemy, damage)

                    if (previousHealth <= damage) {
                        iterate()
                    }
                }
            }) 
        }
        iterate()
        onFinish()
    }
}

export class GroundGuild extends Guild {
    readonly action = ['Когда вы призываете этого элменталя Земли, нанесите по 1 урону каждому врагу в этой локации.', 'При активации нанесите 2 урона первому врагу в этой локации']
    readonly name: string = 'Земля'
    readonly icon: string = ''
    readonly color: string = 'yellow-800'

    activate = (field: Field, fields: FieldsController, killer: Killer, _: CardsController, onFinish: Function) => {
        this.attackFirstInCol(field, fields, killer, 2)
        onFinish()
    }

    spawn = (field: Field, fields: FieldsController, killer: Killer, _: CardsController, onFinish: Function) => {
        fields.getEnemyAllElementalsInThisNodeSync(field).forEach(enemy => {
            killer.hit(field, enemy, 1)
        })
        onFinish()
    }
}

export class AcidGuild extends Guild {
    readonly action = ['Нанесите 3 урона первому врагу в этой локации.', 'Нанесите 1 урон второму врагу в этой локации. Если при этом элементаль Кислоты уничтожает врага вы не получаете очков энергии']
    readonly name: string = 'Кислота'
    readonly icon: string = ''
    readonly color: string = 'green-200'
    readonly pointsForKill: number = 0

    activate = (field: Field, fields: FieldsController, killer: Killer, _: CardsController, onFinish: Function) => {
        const enemies = fields.getEnemyAllElementalsInThisNodeSync(field)
        killer.hit(field, enemies[0], 3)
        killer.hit(field, enemies[1], 1)
        onFinish()
    }
}

export class CometGuild extends Guild {
    readonly action = ['Нанесите 2 урона первому врагу в этой локации', 'Если у вас на руке меньше 7 карт, возьмите 1 карту из своей колоды']
    readonly name: string = 'Комета'
    readonly icon: string = ''
    readonly color: string = 'blue-800'

    activate = (field: Field, fields: FieldsController, killer: Killer, cards: CardsController, onFinish: Function) => {
        this.attackFirstInCol(field, fields, killer, 2)

        if (cards.hand.cards.length < 7) {
            cards.addCardsToHand(1)
        }

        onFinish()
    }
}

export class LoveGuild extends Guild {
    readonly action  = ['Когда вы призываете этого элменталя любви, снимите все жетоны урона с одного союзника в этой локации', 'Нанесите 2 урона первому врагу в этой локации']
    readonly name: string = 'Любовь'
    readonly icon: string = ''
    readonly color: string = 'purple-400'

    activate = (field: Field, fields: FieldsController, killer: Killer, _: CardsController, onFinish: Function) => {
        this.attackFirstInCol(field, fields, killer, 2)
        onFinish()
    }

    spawn = (field: Field, fields: FieldsController, __: Killer, _: CardsController, onFinish: Function) => {
        fields.getAnyElementalInThisNodeAsync(field, healedField => {
            if (healedField) {
                healedField.elemental!.healToMax()
            }

            onFinish()
        })
    }
}

export class MusicGuild extends Guild {
    readonly action = ['Нанесите 2 урона первому врагу в этой локации', 'Если при этом элементаль Музыки уничтожает врага, переместите его на вашу сторону разлома в одну из соседних локаций']
    readonly name: string = 'Лед'
    readonly icon: string = ''
    readonly color: string = 'zinc-200'

    activate = (field: Field, fields: FieldsController, killer: Killer, cards: CardsController, onFinish: Function) => {
        const enemy = fields.getFirstEnemyElementalFieldInThisColSync(field)

        if (enemy) {
            killer.hitWithoutDeath(field, enemy, 2)
            const enemyElemental = enemy.elemental!

            if (enemyElemental.isDead) {
                enemyElemental.healToMax()

               fields.getNeighBoorLastEmptyFieldAsync(field, neighboorPlace => {
                    fields.transferElementalToNewField(enemy, neighboorPlace)
                    neighboorPlace!.elemental!.guild.spawn(neighboorPlace, fields, killer,  cards, onFinish)
               })
            }
        }
    }
}

export class BeastGuild extends Guild {
    readonly action = ['Переместите этого элменталя Оборотня в соседнюю локацию', 'Если этому элменталю Оборотня уже нанесен хотя бы 1 урон, нанесите 3 урона первому врагу в новой локации. В ином случае нанесите врагу 2 урона']
    readonly name: string = 'Оборотень'
    readonly icon: string = ''
    readonly color: string = 'red-90'

    activate = (field: Field, fields: FieldsController, killer: Killer, _: CardsController, onFinish: Function) => {
        this.transferToNeighbors(field, fields, newPlace => {
            const damage = newPlace.elemental!.health < newPlace.elemental!.maxHealth 
            ? 3
            : 2

            this.attackFirstInCol(newPlace, fields, killer, damage)
            onFinish()
        }) 
    }
}

export class MagneticGuild extends Guild {
    readonly action = ['Нанесите 2 урона последнему врагу в этой локации', 'Переместите данного врага и этого элементаля Магнетизма в соседнюю локаци']
    readonly name: string = 'Магнетизм'
    readonly icon: string = ''
    readonly color: string = 'grey-600'

    activate = (field: Field, fields: FieldsController, killer: Killer, _: CardsController, onFinish: Function) => {
        const enemy = fields.getLastEnemyElementalInThisColSync(field)

        if (enemy) {
            killer.hit(field, enemy, 2)
        }

        fields.getNeighBoorLastEmptyFieldAsync(field, neighbour => {
            fields.transferElementalToNewField(field, neighbour!)
       
            if (enemy) {
                const newEnemyPlace = fields.getLastFieldInNode(neighbour!.parent.up!)
                fields.transferElementalToNewField(enemy, newEnemyPlace )
            }  

            onFinish()
        })
    }
}

export class SandGuild extends Guild {
    readonly action = ['Переместите этого элементаля Песка в любую дургую локацию.', 'Нанесите по 1 урону каждому врагу в новой локации.', 'Снимите 1 урон с активированного элементаля Песка']
    readonly name: string = 'Песок'
    readonly icon: string = ''
    readonly color: string =  'yellow-100'

    activate = (field: Field, fields: FieldsController, killer: Killer, _: CardsController, onFinish: Function) => {
        this.transferToAny(field, fields, newPlace => {
            const enemies =  fields.getEnemyAllElementalsInThisNodeSync(newPlace)
            enemies.forEach(enemy => {
                killer.hit(newPlace, enemy, 1)
            })
    
            newPlace.elemental!.heal(1)
            onFinish()
        })
    }
}

export class LavaGuild extends Guild {
    readonly action = ['Нанесите по 2 урона каждому из первых врагов в соседних локациях', "Нанесите 1 урон этому элменталю Лвы и всем союзникам, которые выложены перед ним"]
    readonly name: string = 'Лава'
    readonly icon: string = ''
    readonly color: string = 'orange-600'

    activate = (field: Field, fields: FieldsController, killer: Killer, _: CardsController, onFinish: Function) => {
        const enemies = fields.getAllNeighBoorEnemyFirstElementalsSync(field)
        const fieldsBefore = fields.getFieldsWithElementalBeforeSync(field)

        const myFieldsForAttack: Field[] = [...fieldsBefore, field]

        myFieldsForAttack.forEach(f => {
            killer.hit(field, f, 1)
        })

        enemies.forEach(f => {
            killer.hit(field, f, 2)
        }) 

        onFinish()
    }
}



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
    readonly code: MobDataCode

    constructor(guild: Guild, value: number, index = 0) {
        this.guild = guild
        this.value = value
        this.code = MobData.parseCode(guild.code as GuildCode, value, index)
    }

    static parseCode = (guild: GuildCode, value: number, index = 0): MobDataCode => {
        return `${guild}_${value}_${index}`
    }
}



export class User {
    readonly id: string
    readonly name: string
    readonly email: string
    readonly avatar: null | string = null
    readonly rating: number
    type: UserType

    constructor (id: string, name: string,  email: string, avatar: string | null, rating?: number, type?: UserType) {
        this.id = id
        this.name = name
        this.avatar = avatar
        this.email = email
        this.rating = rating || 0
        this.type = type || UserType.user
    }

    setType = (type: UserType) => {
        this.type = type
    }
}

export class AuthUser extends User {
    readonly isAdmin: boolean
    readonly activated: boolean

    constructor(id: string, name: string,  email: string, avatar: string | null, rating: number, isAdmin: boolean, activated: boolean) {
        super(id, name, email, avatar, rating, UserType.user)
        this.activated = activated
        this.isAdmin = isAdmin
    }
}


export class MapNode {
    next: MapNode | null = null
    prev: MapNode | null = null
    up: MapNode | null = null 
    down: MapNode | null = null 
    readonly user: UserTuple | null
    private mediator: Mediator
    readonly index: number = 0
    fields: Field[]
    code: MapNodeCode 

    constructor (mediator: Mediator, user?: UserTuple, index?: number) {
        this.user = user || null
        this.mediator = mediator
        this.fields = []
        this.index = index || this.index

        if (user) {
            this.addField()
            this.code = MapNode.parseCode(user[0].id, this.index)
        } else {
            this.code = this.index.toString()
        }
    }

    static parseCode = (userId: string, index = 0): MapNodeWithUserCode => {
        return `${userId}_${index}`
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

    select = () => this.interact(LOG_ACTIONS.select_field)

    static parseCode = (nodeCode: MapNodeWithUserCode, elementalCode: ElementalCode): FullFieldCode => {
        return `${nodeCode}_${elementalCode}`
    }

    get code (): FullFieldCode | MapNodeWithUserCode  {
        if (this.elemental && this.parent.user) {
            return Field.parseCode(this.parent.code as MapNodeWithUserCode, this.elemental.code)
        }

        return this.parent.code as MapNodeWithUserCode
    }

    createElemental(data: MobData, helath?: number) {
        if (!this.elemental) {
            this.elemental = new Elemental(data, helath)
            this.next = new Field(this.parent, this.mediator)

            this.parent.addField()
        }
    }

    setElemental = (elemental: Elemental) => {
        this.elemental = elemental
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
    
    constructor(data: MobData, currentHealth?: number) {
        this.mobData = data
        this.health = currentHealth || this.maxHealth
    }

    get maxHealth () {
        return this.mobData.value
    }

    get code (): ElementalCode {
        return Elemental.parseCode(this.mobData.code, this.health)
    }

    get guild () {
        return this.mobData.guild
    }

    hit(damage: number) {
        this.health -= damage
    } 

    static parseCode = (mobDataCode: MobDataCode, health: number): ElementalCode => {
        return `${mobDataCode}_${health}`
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



enum InteractionsVariants {
    guild = 'GUILD',
    value = 'VALUE'
} 

export const LOG_ACTIONS = {
    summon: 'SUMMON',
    activate: 'ACTIVATE',
    select_card: 'SELECT_CARD',
    select_field: 'SELECT_FIELD',
    start_stage: 'SART_STAGE',
    stop_stage: 'STOP_STAGE',
    select_guild: 'SELECT_GUILD',
    draw: 'DRAW',
    start_action_iteration: 'START_ACTION_ITERATION',
    stop_turn: 'STOP_TURN',
    activated: 'ACTIVATED',
    spawned: 'SPAWNED',
    die: "DIE",
    pick: 'PICK',
    switch_turn: "SWITCH_TURN",
    ban: 'BAN',
    hit:  (damage: number) => `HIT_${damage}`,
    spawnBy: (type: keyof typeof InteractionsVariants) => `SPAWNED_BY_${InteractionsVariants[type]}`,
    activateBy: (type: keyof typeof InteractionsVariants) => `ACTIVATE_BY_${InteractionsVariants[type]}`
} as const


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

    summon = () => this.usable && this.interact(LOG_ACTIONS.summon, 'extra')
    activate = () => this.usable && this.interact(LOG_ACTIONS.activate, 'extra')
    select = () => !this.usable && this.interact(LOG_ACTIONS.select_card)

    onSummon = () => this.handleInteract(this.summon)
    onActivate = () => this.handleInteract(this.interact)

    setUsable = (status: boolean) => {
        this.usable = status
    }
}

export class Deck<T = MobData> {
    cards: T[] = []

    constructor(cards?: T[]) {
        cards && this.setCards(cards)
    }
    
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


const initFormatter = (command: Command | null) => command

export abstract class BaseController implements Mediator {
    enabled: boolean = true
    readonly highlighted: Set<SelectiveElement> = new Set<SelectiveElement>()
    protected resolve?: ((payload: any) => void)
    private formatter: CommandFormatter = initFormatter
    private clickable: boolean = false
    private highlightable: boolean = false
    private avaialbe: boolean = true

    setHighlightable = (status: boolean) => {
        if (this.enabled) {
            this.highlightable = status
        }
    }

    setAvaialbe = (status: boolean) => {
        this.avaialbe = status
        this.highlighted.forEach(el => el.setAvailable(status))
    }

    logAction: LogAction | undefined

    setLogAction = (action: LogAction) => {
        this.logAction = action
    }

    constructor(logAction?: LogAction) {
        this.logAction = logAction
        makeObservable(this, {
            enabled: observable,
            setEnabled: action
        })
        this.resetHighlights.bind(this)
    }

    setClickable = (status: boolean) => {
        if (this.enabled) {
            this.clickable = status
        }
    }
 
    setEnabled = (status: boolean) => {
        this.enabled = status
        this.setAvaialbe(status)
    }

    protected formatCommand = (command: Command): any => {
        return command
    }
    abstract getObservableElCode(el: SelectiveElement): string

    notify(target: any, message: string, extra?: unknown): void {
        if (this.resolve && this.enabled) {
            this.resetHighlights()
            const currentResolve = this.resolve

            if (this.logAction) {
                const type = extra && typeof extra === "string" ? extra as any : undefined
                this.logAction({ target: this.getObservableElCode(target), action: message, type })
            }

            this.resolve(this.formatter({ target, message })) 
            
            if (currentResolve === this.resolve) {
                this.reset()
            }
        }   
    }

    resetHighlights() {
        if (this.enabled) {
            this.highlighted.forEach(el => el.highlight(false, false, false))
            this.highlighted.clear()
        }
    }

    highlight = (el: SelectiveElement, config?: HighlightElementConfig) => {
        if (this.enabled) {
            const finalHighlightableStatus = this.highlightable && (config ? config.highlightable !== undefined ? config.highlightable : true : true)
            const finalClickableStatus = this.clickable && (config ? config.clickable !== undefined ? config.clickable : true  : true)
            const finalAvailableStatus = this.avaialbe && (config ? config.available !== undefined ? config.available : true  : true)

            console.log(finalHighlightableStatus, finalClickableStatus)

            if (finalClickableStatus || finalHighlightableStatus || finalAvailableStatus) {
                el.highlight(finalHighlightableStatus, finalAvailableStatus, finalClickableStatus)
                this.highlighted.add(el)
            }
        }
    }

    reset = () => {
        if (this.enabled) {
            this.resetHighlights()
            this.resolve = undefined
            this.formatter = initFormatter
        }
    }

    // always need to use after highligtes
    protected observe<D = unknown, T = unknown>(cb: (data: T) => void, formatter?: (com: Command<D>) => T, autoReturn = true) {
        if (this.highlighted.size === 0 && autoReturn) {
            cb(formatter ? formatter({ target: null as D, message: 'null' }) : null as T)
        } else {
            this.resolve = cb

            if (formatter) {
                this.formatter = formatter
            }
        }
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
    readonly left: Deck = new Deck()
    readonly hand: Deck<Card> = new Deck<Card>()
    readonly total: Deck = new Deck()
    canDraw: boolean = false
    private readonly maxCardsInHand: number

    constructor(maxCountInHand?: number) {
        super()
        this.maxCardsInHand = maxCountInHand || 7
    }

    setLeftCards = (left: Deck) => {
        this.left.cards = left.cards
    }

    setHandCards = (hand: Deck) => {
        this.hand.cards = hand.cards.map(mob => this.createCard(mob))
    }

    setTotalCards = (total: Deck) => {
        this.total.cards = total.cards
    }

    getObservableElCode = (el: Card): string => {
        return el.mobData.code
    }

    addCardsToHand(count: number) {
        if (this.hand.size < this.maxCardsInHand) {
            for (let i = 0; i < count; i++) {
                if (this.total.size > 0) {
                    const takenMobData = this.total.cards.pop()!
                    this.hand.add(this.createCard(takenMobData))
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
        this.addCardsToHand(this.maxCardsInHand - this.hand.size)
    }

    updateCardsDeck() {
        this.left.cards.forEach((_,__, arr) => {
            this.total.add(arr.pop()!)
        });
        this.total.shuffle()
    }

    makeDraw() {
        if (this.canDraw && this.resolve) {
            this.resolve({ target: this, message: LOG_ACTIONS.draw })
        }
    }

    private highlightCardsSameAny = (data: any, cb: (data: any, card: MobData) => boolean, config?: HighlightElementConfig) => {
        this.iterateThroughHand(card => {
            if (cb(data, card.mobData)) {
                this.highlight(card, config)
                card.setUsable(false)
            }
        })
    }

    highlightCardsSameGuild = (guild: Guild, config?: HighlightElementConfig) => {
        this.highlightCardsSameAny(guild, (data, c) => data === c.guild, config)
    }

    highlightCardsByValue = (value: number, config?: HighlightElementConfig) => {
        this.highlightCardsSameAny(value, (data, c) => data === c.value, config)
    }

    protected observe<D = unknown, T = unknown>(cb: (data: T) => void, formatter?: ((com: Command<D>) => T), autoReturn = true, from: Extract<keyof CardsController, 'hand' | 'total' | 'left'> = 'hand'): void {
        super.observe<D, T>(cb, com => {
            if (com.message !== LOG_ACTIONS.draw) {
                this[from].remove(com.target as (Card & MobData))
            }

            return formatter ? formatter(com) : com as T
        }, autoReturn)
    }

    getCardsSameGuildAsync = (guild: Guild, cb: CardWithoutResultHandler, config?: HighlightElementConfigForGetActions) => {
        this.highlightCardsSameGuild(guild, { available: true, ...config })
        this.observe<Card | null, MobData | null>(cb, c =>  c.target ? c.target.mobData : null)
    }

    getCardsSameValueAsync = (value: number, cb: (data: MobData | null) => void, config?: HighlightElementConfigForGetActions) => {
        this.highlightCardsByValue(value, { available: true, ...config })
        this.observe<Card | null, MobData | null>(cb, c =>  c.target ? c.target.mobData : null)
     }

    moveCardFromHandToLeft = (data: MobData) => {
        const found = this.hand.cards.find(card => card.mobData === data)

        if (found) {
            this.hand.remove(found)
            this.left.add(data)
        }
    }

    resetHighlights = (): void => {
        this.highlighted.forEach(el => {
            el.highlight(false, false, false);
            (el as Card).setUsable(false)
        })
        this.highlighted.clear()
    }

    highlightHand = (config?: HighlightElementConfig) => {
        this.iterateThroughHand(card => {
            this.highlight(card, config)
            card.setUsable(true)
        })
    }

    getSomeCardCommandAsync = (cb: (command: Command) => void, config?: HighlightElementConfigForGetActions) => {
        if (this.enabled) {
            this.canDraw = this.hand.size < 7
        }

        this.highlightHand({ available: true, ...config })

        if (this.highlighted.size === 0) {
            cb({ target: null as unknown, message: LOG_ACTIONS.draw  })
        } else {
            this.observe(cb)
        }
    }

    private iterateThroughHand = (cb: (card: Card) => void) => {
        this.hand.cards.forEach(cb)
    }

    pushCardToHand = (data: MobData) => {
        this.hand.add(this.createCard(data))
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

    getObservableElCode = (el: Field): string => {
        return el.code
    }

    // setStartNode = (node: MapNode) => {
    //     this.startNode = node
    // }

    getFirstEnemyElementalFieldInThisColSync = (field: Field) => {
        const enemyFields = field.parent.up?.fields!

        if (enemyFields.length === 1) {
            return null
        }

        return enemyFields[0]
    }

    calculateControllerNodesByUser = (user: User) => {
        let countOfEmptyNodes = 0

        this.iterateThroughUserNodes(node => {
            const isControlledArea = node.up && node.up.isEmpty && !node.isEmpty
            
            if (isControlledArea) {
                countOfEmptyNodes++            
            }
        }, user)

        return countOfEmptyNodes
    }

    private highlightElemental = (field: Field | null, config?: HighlightElementConfig) => {
        if (field?.elemental) {
            this.highlightField(field, config)
        }
    }

    private highlightField = (field: Field | null, config?: HighlightElementConfig) => {
        if (field) {
            this.highlight(field, config)
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

    highlightNeighBoorEnemyFirstElemental = (field: Field, config?: HighlightElementConfig) => {
        this
            .getEnemyNeighBoors(field)
            .forEach(node => 
                this.highlightElemental(this.getFirstFieldWithElementalInNode(node), config)
            )
    }

    getNeighBoorEnemyFirstElementalAsync = (field: Field, cb: FieldHandlerWithNoResult, config?: HighlightElementConfigForGetActions) => {
        this.highlightNeighBoorEnemyFirstElemental(field, { available: true, ...config })
        this.formattedObserve(cb)
    }

    private formattedObserve = (cb: FieldHandler, autoReturn: boolean = true) => {
        if (this.highlighted.size === 1 && autoReturn) {
            this.highlighted.forEach((field) => {
                cb(field as Field)
            })
            this.reset()
        } else {
            this.observe<Field, Field>(cb, c => c!.target)
        }       
    }

    getAllNeighBoorEnemyFirstElementalsSync = (field: Field) => {
       return this.getEnemyNeighBoors(field).map(this.getFirstFieldWithElementalInNode).filter(f => f) as Field[]
    }

    transferElementalToNewField = (from: Field, to: Field) => {
        if (from.elemental && !to.elemental) {
            to.elemental = from.elemental
            to.parent.addField()
            from.delete()
        }
    }

    iterateThroughUserNodes = (cb: (node: MapNode) => void, user: User) => {
        if (this.startNode.next) {
            this.iterator.iterateThroughRound(this.startNode.next, node => {
                if (node.user && node.user[0] === user) {
                    cb(node)
                }
            })
        }
    }

    iterateThroughTeamNodes = (cb: (node: MapNode) => void, team: Team) => {
        if (this.startNode.next) {
            this.iterator.iterateThroughRound(this.startNode.next, node => {
                if (node.user && node.user[1] === team) {
                    cb(node)
                }
            })
        }
    }

    private highlightSomeElementalsInNode = (data: MobData, exceptions: Field[], isEqual: EqualFunction, config?: HighlightElementConfig) => (node: MapNode) => {
            node.fields.forEach(field => {
                if (field.elemental && isEqual(field.elemental, data) && !exceptions.includes(field)) {
                    this.highlightElemental(field, config)
                }
            })
    }

    highlightTeamElementalsByAny = (team: Team ,data: MobData, isEqual: (el: Elemental, data: MobData) => boolean, exceptions: Field[], config?: HighlightElementConfig) => {
        this.iterateThroughTeamNodes(this.highlightSomeElementalsInNode(data, exceptions, isEqual, config), team)
    }

    highlightUserElementalsByAny = (user: User ,data: MobData, isEqual: (el: Elemental, data: MobData) => boolean, exceptions: Field[], config?: HighlightElementConfig) => {
        this.iterateThroughUserNodes(this.highlightSomeElementalsInNode(data, exceptions, isEqual, config), user)
    }

    highLightTeamElementalsByGuild = (team: Team, data: MobData, exceptions: Field[], config?: HighlightElementConfig) => {
        this.highlightTeamElementalsByAny(team, data, (el, data) => el.guild === data.guild, exceptions, config)
    }

    highlightTeamElementalsByValue = (team: Team, data: MobData, exceptions: Field[], config?: HighlightElementConfig) => {
        this.highlightTeamElementalsByAny(team, data, (el, data) => el.maxHealth === data.value, exceptions, config)
    }

    highLightUserElementalsByGuild = (user: User, data: MobData, exceptions: Field[], config?: HighlightElementConfig) => {
        this.highlightUserElementalsByAny(user, data, (el, data) => el.guild === data.guild, exceptions, config)
    }

    highlightUserElementalsByValue = (user: User, data: MobData, exceptions: Field[], config?: HighlightElementConfig) => {
        this.highlightUserElementalsByAny(user, data, (el, data) => el.maxHealth === data.value, exceptions, config)
    }  

    getTeamElementalsByValueAsync = (team: Team, data: MobData, exceptions: Field[], cb: FieldHandlerWithNoResult, config?: HighlightElementConfigForGetActions & { autoReturn?: boolean }) => {
        this.highlightTeamElementalsByValue(team, data, exceptions, { available: true, ...config })
        this.formattedObserve(cb, !!config?.autoReturn)
    }

    getUserElementalsByValueAsync = (user: User, data: MobData, exceptions: Field[], cb: FieldHandlerWithNoResult, config?: HighlightElementConfigForGetActions & { autoReturn?: boolean }) => {
        this.highlightUserElementalsByValue(user, data, exceptions, { available: true, ...config })
        this.formattedObserve(cb, !!config?.autoReturn)
    }

    getTeamElementalByGuildAsync = (team: Team, data: MobData, exceptions: Field[], cb: FieldHandlerWithNoResult, config?: HighlightElementConfigForGetActions & { autoReturn?: boolean }) => {
        this.highLightTeamElementalsByGuild(team, data, exceptions, { available: true, ...config })
        this.formattedObserve(cb, !!config?.autoReturn)
    }

    getUserElementalByGuildAsync = (user: User, data: MobData, exceptions: Field[], cb: FieldHandlerWithNoResult, config?: HighlightElementConfigForGetActions & { autoReturn?: boolean }) => {
        this.highLightUserElementalsByGuild(user, data, exceptions, { available: true, ...config })
        this.formattedObserve(cb, !!config?.autoReturn)
    }

    getLastFieldInNode = (node: MapNode) => {
        return node.fields[node.fields.length - 1]
    }

    getFirstFieldWithElementalInNode = (node: MapNode) => {
        if (node.fields.length === 1) {
            return null
        }

        return node.fields[0]
    }

    // private getFirstFieldInNode = (node: MapNode) => {
    //     return node.fields[0]
    // }

    private highlightEmptyFieldHandler = (nodesExceptions: MapNode[], config?: HighlightElementConfig) => (node: MapNode) => {
        if (!nodesExceptions.includes(node)) {
            this.highlightField(this.getLastFieldInNode(node), config)
        }
    }

    highlightTeamAnyLastEmptyField = (team: Team, nodesExceptions: MapNode[], config?: HighlightElementConfig) => {
        this.iterateThroughTeamNodes(this.highlightEmptyFieldHandler(nodesExceptions, config), team)
    }

    highlightUserAnyLastEmptyField = (user: User, nodesExceptions: MapNode[], config?: HighlightElementConfig) => {
        this.iterateThroughUserNodes(this.highlightEmptyFieldHandler(nodesExceptions, config), user)
    }

    getTeamAnyLastEmptyFieldAsync = (team: Team, nodesExceptions: MapNode[], cb: FieldHandler, config?: HighlightElementConfigForGetActions) => {
       this.highlightTeamAnyLastEmptyField(team, nodesExceptions, { available: true, ...config })
       this.formattedObserve(cb)
    }

    getUserAnyLastEmptyFieldAsync = (user: User, nodesExceptions: MapNode[], cb: FieldHandler, config?: HighlightElementConfigForGetActions) => {
        this.highlightUserAnyLastEmptyField(user, nodesExceptions, { available: true, ...config })
        this.formattedObserve(cb)
     }

    getEnemyFirstElementalsInThreeColsSync = (field: Field) => {
        const fields: (Field | null)[] = []

        const addFields = (node: MapNode) => {
            fields.push(this.getFirstFieldWithElementalInNode(node))
        }

        addFields(field.parent.up!)
        this.getNeighBoors(field.parent.up!).forEach(addFields)

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

    getFieldsWithElementalBeforeSync = (field: Field) => {
        return this.getBeforeAfterElementalsSync(field, 'prev')
    }

    getFieldsWithElementalAfterSync = (field: Field) => {
        return this.getBeforeAfterElementalsSync(field, 'next')
    }

    getNeighBoorLastEmptyFieldAsync = (field: Field | Field[], cb: FieldHandler, config?: HighlightElementConfigForGetActions) => {
        this.highlightNeighBoorLastEmptyFields(field, { available: true, ...config })
        this.formattedObserve(cb)
    }

    highlightNeighBoorLastEmptyFields = (field: Field | Field[], config?: HighlightElementConfig) => {
        if (Array.isArray(field)) {
            const highlightNeighBoor = (node: MapNode | null) => {
                if (node) {
                    this.highlightField(this.getLastFieldInNode(node), config)
                }
            }
        
            highlightNeighBoor(field[0].parent.prev)
            highlightNeighBoor(field[field.length - 1].parent.next)
        } else {
            this.getMyNeighBoors(field).forEach(node => this.highlightField(this.getLastFieldInNode(node), config))
        }
    }

    highlightLastFieldInNode = (field: Field, config?: HighlightElementConfig) => {
        this.highlightField(this.getLastFieldInNode(field.parent), config)
    }

    getLastNeighBoorsAndCurrentEmptyFieldAsync = (field: Field, cb: FieldHandler, config?: HighlightElementConfigForGetActions) => {
        this.highlightLastFieldInNode(field, { available: true, ...config })
        this.highlightNeighBoorLastEmptyFields(field, { available: true, ...config })
        this.formattedObserve(cb)
    }

    getLastFieldInThisNodeAsync = (field: Field, cb: FieldHandler, config?: HighlightElementConfigForGetActions) => {
        this.highlightLastFieldInNode(field, { available: true, ...config })
        this.formattedObserve(cb)
    }

    highlightAnyElementalInThisNode = (field: Field, config?: HighlightElementConfig) => {
        field.parent.fields.forEach(f => f !== field && this.highlightElemental(f, config))
    }

    highlightEnemyAnyElementalInThisNode = (field: Field, config?: HighlightElementConfig) => {
        field.parent.up!.fields.forEach(f => this.highlightElemental(f, config))
     }

    getEnemyAnyElementalInThisNodeAsync = (field: Field, cb: FieldHandlerWithNoResult, config?: HighlightElementConfigForGetActions) => {
        this.highlightEnemyAnyElementalInThisNode(field, { available: true, ...config })
        this.formattedObserve(cb)
     }

    getAnyElementalInThisNodeAsync = (field: Field, cb: FieldHandlerWithNoResult, highlightable?: boolean) => {
       this.highlightAnyElementalInThisNode(field, { clickable: true, highlightable })
       this.formattedObserve(cb)
    }

    private highlighAnyElementalHandler = (exceptions: Field[], config?: HighlightElementConfig) => (node: MapNode) => {
        node.fields.forEach(f => !exceptions.includes(f) && this.highlightElemental(f, config))
    }
    
    highlightTeamAnyElemental = (team: Team, exception: Field[], config?: HighlightElementConfig) => {
       this.iterateThroughTeamNodes(this.highlighAnyElementalHandler(exception, config), team)
    }

    highlightUserAnyElemental = (user: User, exception: Field[], config?: HighlightElementConfig) => {
        this.iterateThroughUserNodes(this.highlighAnyElementalHandler(exception, config), user)
     }

    getTeamAnyElementalAsync = (team: Team, exceptions: Field[], cb: FieldHandlerWithNoResult, config?: HighlightElementConfigForGetActions) => {
        this.highlightTeamAnyElemental(team, exceptions, { available: true, ...config })
        this.formattedObserve(cb)
    }

    getUserAnyElementalAsync = (user: User, exceptions: Field[], cb: FieldHandlerWithNoResult, config?: HighlightElementConfigForGetActions) => {
        this.highlightUserAnyElemental(user, exceptions, { available: true, ...config })
        this.formattedObserve(cb)
    }

    getConcreteFieldAsync = (code: string, cb: FieldHandlerWithNoResult) => {
        const found = this.getConcreteFieldSync(code)
        cb(found)
    }

    iterateThroughAllNodes = (cb: (node: MapNode) => void) => {
        if (this.startNode.next) this.iterator.iterateThroughLine(this.startNode.next, cb, this.startNode, 'next', true)
    }

    getEnemyAllElementalsInThisNodeSync = (field: Field) => {
        return field.parent.up!.fields.filter(f => f.elemental)
    }

    getConcreteFieldSync = (code: string): Field | null => {
        const [userId, index, guildCode, value, mobIndex] = code.split('_')
        let selectedField = null

        if (this.startNode.next) {
            this.iterator.iterateThroughLine(this.startNode.next, node => {
                if (node.user && node.user[0].id === userId && node.index === +index) {
                    if (guildCode !== undefined && value !== undefined && mobIndex !== undefined) {
                        selectedField = node.fields.find(field => {
                            if (field.elemental) {
                                return field.elemental.mobData.code === MobData.parseCode(guildCode as GuildCode, +value, +mobIndex)
                            }
                            return false
                        })
                    } else {
                        selectedField = node.lastField
                    }
                }
            }, this.startNode, 'next', true)
        }

        return selectedField
    }

    getTeamFieldsInArray = (team: Team) => {
        const arr: Field[][] = []
        this.iterateThroughTeamNodes(node => arr.push(node.fields), team)
        return arr
    }

    getEnemyFieldsForTeamInArray = (team: Team) => {
        const arr: Field[][] = []
        this.iterateThroughTeamNodes(node => arr.push(node.up!.fields), team)
        return arr
    }

    getEnemyFieldsForUserInArray = (user: User) => {
        const arr: Field[][] = []
        this.iterateThroughUserNodes(node => arr.push(node.up!.fields), user)
        return arr
    }

    getUserFieldsInArray = (user: User) => {
        const arr: Field[][] = []
        this.iterateThroughUserNodes(node => arr.push(node.fields), user)
        return arr
    }
}

abstract class InGameStageUpdater<T extends InGameStage> {
    stage: T

    constructor(stage: T) {
        this.stage = stage
    }

    abstract updateAllState(state: Pick<ServerGameState, 'teams' | 'guilds' | 'logs'>): void
}



export class GameRoomUpdater {
    stage: GameRoom

    constructor (stage: GameRoom) {
        this.stage = stage
    }

    updateOwner = ({ owner }: ServerFinalState) => {
        const user = this.stage.teams.map(team => team.users).flat().find(user => user.id === owner)
       
        if (user) {
            this.stage.owner = user
        }
    }

    updateTeams = ({ teams }: ServerFinalState) => {
        this.stage.teams = teams.map(RoomTeamMapper.toDomain)
    }

    updateName = ({ roomState: { name } }: ServerFinalState) => {
        this.stage.props.name = name
    }

    updateProps = ({ roomState: { props, password, type, name }}: ServerFinalState) => {
        this.stage.props.setData({ ...props, type, password, name })
    }
}

export class GameProcessUpdater extends InGameStageUpdater<GameProcess> {

    updateTeamPoints = (data: ServerTeamPoints[]) => {
        data.forEach(({ id, points }) => {
            this.stage.points.setPointByTeamId(id, points)
        })
    }

    updateUserDecks = (data: ServerUserCards[]) => {
        this.stage.usersCards.forEach((controller, user) => {
            const userData = data.find(u => u.id === user.id)

            if (userData) {
                const { left, hand, deck } = userData.cards

                controller.setHandCards(DeckMapper.toDomain(hand))
                controller.setLeftCards(DeckMapper.toDomain(left))
                controller.setTotalCards(DeckMapper.toDomain(deck))
            }
        })
    }

    updateGameField = (data: ServerUserFields[]) => {
        this.stage.gameField.iterateThroughAllNodes(node => {
            if (node.user) {
                const user = node.user[0]

                const userFeilds = data.find(({ id }) => user.id === id)

                if (userFeilds) {
                    const fields = userFeilds.fields[node.index]

                    if (fields) {
                        node.setFields([])
                        node.addField()
                        fields.forEach(field => {
                                node
                                    .lastField!
                                    .setElemental(ElementalMapper.toDomain(field))
                                node.addField()
                            })
                    }
                }
            }
        })
    }

    updateAllState = (state: GameProcessUpdateAllStatePayload) => {
        const usersState = state.teams.map(team => team.users).flat()
        this.updateGameField(usersState)
        this.updateUserDecks(usersState)
        this.updateTeamPoints(state.teams)
    }
}




export class DraftUpdater extends InGameStageUpdater<Draft> {

    private getGuilds = (guilds: GuildCode[]) => GuildFactory.getInstance().createSeveral(guilds)

    updateGuildsPool = (data: ServerGameState['guilds']) => {
        this.stage.guilds.setGuilds(this.getGuilds(data))
    }

    updateUserGuilds = (data: ServerUserDrafts[]) => {
        this.stage.usersDraft.forEach((draft, user) => {
            const userPicks = data.find(d => d.id === user.id)

            if (userPicks) {
                const { draft: { picks, bans } } = userPicks

                draft.setChosen(this.getGuilds(picks))
                draft.setBanned(this.getGuilds(bans))
            }
        })
    }

    updateAllState = (state: DraftUpdateAllStatePayload) => {
        this.updateUserGuilds(state.teams.map(team => team.users).flat())
        this.updateGuildsPool(state.guilds)
    }
}

export class GameContentBuilder {
    userCards: Map<User, CardsController> = new Map<User, CardsController>()
    gameField: FieldsController = new FieldsController()
    private users: Turn

    constructor (users: Turn) {
        this.users = users
    }

    setGameFields = (controller: FieldsController) => {
        this.gameField = controller
    }

    parseUserDecks = (decs: Map<User, ServerUserDecks>) => {
        this.userCards = new Map<User, CardsController>()

        for (let entry of decs.entries()) {
            this.userCards.set(entry[0], CardsControllerMapper.toDomain(entry[1]))
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
                        controller.total.add(new MobData(guild, value, i))
                    }
                })
            })

            controller.total.shuffle()
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
                    const userCards = this.userCards.get(singlePlayer)!.total.cards
                    if (userCards.length > 0) {
                        node.fields[0].createElemental(userCards.pop()! )
                    }  
                }
            })
        } else {
            const firstPlayer = this.users.firstTurnUser

            this.gameField.iterateThroughAllNodes(node => {
                if (node.user && node.user[0] === firstPlayer && node.index === (playersCount === 4 ? 1 : 2 )) {
                    const userCards = this.userCards.get(firstPlayer)!.total.cards
                    if (userCards.length > 0) {
                        node.fields[0].createElemental(userCards.pop()! )
                    }
                   
                }
            })
        }

        return this
    }

    createGameField = (usersFields?: Map<User, ElementalCode[][]>) => {
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
                                lastNode
                                    .lastField!
                                    .setElemental(ElementalMapper.toDomain(field))

                                lastNode.addField()
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
                up.up = down
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

    getObservableElCode = (el: GuildCard): string => {
        return el.guild.code
    }

    takeRandomGuildAsync = () => {
        if (this.resolve) {
            this.resolve(this.takeRandomGuild())
        }
    }

    private takeRandomGuild = () => {
        if (this.guilds.length > 0) {
            const guildCard = getRandomElement(this.guilds) as GuildCard
            this.deleteGuildCard(guildCard)
    
            return guildCard.guild
        }

        return null
    }

    takeRandomGuildSync() {
        return this.takeRandomGuild()
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

    highlightGuilds = (config?: HighlightElementConfig) => {
        this.guilds.forEach(card => this.highlight(card, config))
    }

    getGuildAsync = (cb: (g: Guild) => void, config?: HighlightElementConfigForGetActions) => {
        if (this.enabled) {
            this.canRandom = true
            this.highlightGuilds({ available: true, ...config })
            this.observe<GuildCard, Guild>(cb, c => {
                const card = c.target
                this.deleteGuildCard(c.target)
                return card.guild
            })
        }
    }

    getConcreteGuildAsync = (code: GuildCode) => {
        if (this.resolve) {
            const guild = this.guilds.find(card => card.guild.code === code)
            guild && this.deleteGuildCard(guild)
            this.resolve(guild ? guild.guild : null)
        } 
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

    select = () => this.interact(LOG_ACTIONS.select_guild)
}


export class Team<T extends User = User> {
    readonly id: string
    readonly name: string | undefined
    users: T[] = []

    constructor(id: string, users: T[], name?: string) {
        this.id = id
        this.name = name
        this.users = users
        makeAutoObservable(this)
    }

    addUser = (u: T) => {
        if (!this.hasUser(u)) {
            this.users.push(u)
        }
    }

    get playersCount () {
        return this.users.length
    }

    findUserById = (id: string) => {
        return this.users.find(user => user.id === id) || null
    }

    hasUser = (user: User) => {
        return this.users.some(u => u.id === user.id)
    }

    hasUserById = (id: string) => {
        return this.users.some(u => u.id === id)
    }

    removeUserById = (id: string) => {
        this.users = this.users.filter(user => user.id !== id)
    }

    removeUser = (u: T) => {
        this.users = this.users.filter(user => user !== u)
    }
}

export class UsersStorage {
    readonly teams: Team[] = []
    readonly currentUser: User | null = null
    isViewer: boolean = false

    constructor(teams: Team[], currentUser?: User | null) {
        this.teams = teams
        this.currentUser = currentUser || this.currentUser
        this.isViewer = !teams.some(team => team.users.some(u => u.id === this.currentUser?.id))
        
        makeObservable(this, {
            playersCount: computed,
            groupedTeamsInRightOrder: computed
        })
    }

    get playersCount () {
        return this.teams.reduce((acc, t) => acc + t.playersCount, 0)
    }

    get groupedTeamsInRightOrder() {
        const foundTeam = this.currentUser ? this.teams.find(team => team.hasUser(this.currentUser!)) : undefined
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
    isGuest: boolean = false
    private logActionFunction: LogAction | undefined
    private nextTurnSideEffect: NextTurnSideEffect | undefined

    constructor(teams: Team[], currentUser?: User | null, firstTurn?: User, logActionFunction?: LogAction) {
        super(teams, currentUser)
        this.logActionFunction = logActionFunction
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

        const maxCountOfUserPerTeam = this.teams.reduce((acc, team) => Math.max(acc, team.playersCount) ,0)
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
        this.isGuest = currentUser
            ? this.usersOrder.some(([user]) => user.id === currentUser.id)
            : true
    }

    setNextTurnSideEffect = (sideEffect: NextTurnSideEffect) => {
        this.nextTurnSideEffect = sideEffect
    }

    getUserById = (id: string) => {
        const tupple = this.usersOrder.find(([user]) => user.id === id)
        return tupple ? tupple[0] : null
    }

    private logAction = (log: LogPayload) => {
        this.logActionFunction && this.logActionFunction(log)
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

    next(sideEffect?: NextTurnSideEffect) {
        this.currentTurnIndex = this.currentTurnIndex === this.usersOrder.length - 1
            ? 0
            : this.currentTurnIndex + 1

        this.logAction({ action: LOG_ACTIONS.switch_turn, target: this.currentTurn.id, type: "extra" })

        sideEffect
            ? sideEffect(this.currentTurn) 
            : this.nextTurnSideEffect && this.nextTurnSideEffect(this.currentTurn)
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
    
    setPoint = (team: Team, value: number) => {
        this.points.set(team, value)
    }

    setPointByTeamId = (id: string, value: number) => {
        const userTouple = this.turn.usersOrder.find(([, team]) => team.id === id)

        if (userTouple && userTouple[1]) {
            this.setPoint(userTouple[1], value)
        }
    }
    
    get isEndOfTheGame () {
        let max = 0
        
        for (let point of this.points.values()) {
            max = Math.max(point, max)
        }

        return max >= this.maxPoints
    }
}



export class Killer {
    private readonly points: PointsManager 
    private readonly usersCards: UsersCards
    private logActionFunction: LogAction | undefined

    constructor (userCards: UsersCards, points: PointsManager, logActionFunction?: LogAction) {
        this.usersCards = userCards
        this.points = points
        this.logActionFunction = logActionFunction
    }

    setLogAction = (action: LogAction) => {
        this.logActionFunction = action
    }

    private logAction = (log: LogPayload) => {
        if (this.logActionFunction) {
            this.logActionFunction(log)
        }
    }

    private logHit = (killer: Field, victim: Field, damage: number) => {
        this.logAction({ 
            instigator: {
                target: killer.code,
                type: LogInstigatorType.field },
            action: LOG_ACTIONS.hit(damage),
            target: victim.code
        })
    }

    private logDeath = (victim: Field) => {
        this.logAction({ 
            instigator: {
                target: victim.code,
                type: LogInstigatorType.field },
            action: LOG_ACTIONS.die,
            target: null
        })
    }

    hit = (killer: Field | null, victim: Field | null, damage: number) => {
        if (killer && victim && killer.elemental && victim.elemental) {
            victim.elemental.hit(damage)
            this.logHit(killer, victim, damage)

            if (victim.elemental.isDead) {
                this.logDeath(victim)
                const totalPoint = killer.elemental.guild.pointsForKill > 0
                    ? victim.elemental.guild.extraPointsForDeath + killer.elemental.guild.pointsForKill
                    : 0

                this.points.addPointToOppositeTeam(victim.parent.user![1], totalPoint)
                this.usersCards.get(victim.parent.user![0])?.left.add(victim.elemental.mobData)
                victim.delete()
            }
        }
    }

    hitWithoutDeath = (killer: Field | null, victim: Field | null, damage: number) => {
        if (killer && victim && killer.elemental && victim.elemental) {
            victim.elemental.hit(damage)
            this.logHit(killer, victim, damage)

            if (victim.elemental.isDead) {
                this.logDeath(victim)

                const totalPoint = killer.elemental.guild.pointsForKill > 0
                    ? victim.elemental.guild.extraPointsForDeath + killer.elemental.guild.pointsForKill
                    : 0

                this.points.addPointToOppositeTeam(victim.parent.user![1], totalPoint)
            }
        }
    }
}


export abstract class ActionStrategy {
    protected logActionFunction: LogAction | undefined
    protected strategyController: StrategyController | null = null
    protected turn: Turn

    abstract start(onFinish?: Function): void 
    abstract stop(onFinish?: Function): void

    setController = (controller: StrategyController): void  => {
        this.strategyController = controller
    }
    setLogAction = (action: LogAction): void => {
        this.logActionFunction = action
    }

    constructor(turn: Turn) {
        this.turn = turn
    }

    protected logAction = (log: LogPayload) => {
        if (this.logActionFunction) {
            this.logActionFunction(log)
        }
    }
}

export class Draw extends ActionStrategy {
    private readonly cardsController: CardsController
    private readonly fieldsController: FieldsController
    private readonly points: PointsManager

    setLogAction = (action: LogAction) => {
        this.logAction = action
    }

    constructor (cards: CardsController, points: PointsManager, fieldsController: FieldsController, turn: Turn) {
        super(turn)
        this.points = points
        this.cardsController = cards
        this.fieldsController = fieldsController
        this.turn = turn
    }

    start = () => {
        this.logAction({ action: LOG_ACTIONS.draw })
        this.cardsController.replenishHandDeck()
        this.points.addPointToCurrentTurnPlayer(this.fieldsController.calculateControllerNodesByUser(this.turn.currentTurn))
        this.stop()
    }

    stop = () => {
       this.strategyController && this.strategyController.stop()
    }
}


export abstract class SequentialStrategy extends ActionStrategy {
    readonly data: MobData
    abstract code: GameStrategyCodeType
    protected readonly interactedFields: Field[] = []
    protected readonly cardsController: CardsController
    protected readonly fieldsController: FieldsController
    protected readonly killer: Killer
    protected activeGuild: Guild | null = null
    protected activeValue: number | null = null
    protected response: null | Function = null
    protected canChoose: boolean = false
    index: number = 0

    constructor (cards: CardsController, killer: Killer, fieldsController: FieldsController, data: MobData, turn: Turn) {
        super(turn)
        this.killer = killer
        this.cardsController = cards
        this.fieldsController = fieldsController
        this.data = data 
    }

    chooseGuild = () => {
        if (this.canChoose) {
            this.activeGuild = this.data.guild
            this.startAction()
        }
    }

    abstract highlightByValue (): void
    abstract highlightByGuild (): void
    abstract startAction(): void

    protected get interactType () {
        return this.activeGuild ? 'guild' : 'value'
    }

    resetHighlights = () => {
        this.cardsController.resetHighlights()
        this.fieldsController.resetHighlights()
    }

    chooseValue = () => {
        if (this.canChoose) {
            this.activeValue = this.data.value
            this.startAction()
        }
    }

    start(): void {
        this.canChoose = true
    }

    decline = () => {
        this.cardsController.reset()
        this.fieldsController.reset()
        this.strategyController?.stop(true)
    }

    stop = () => {
        this.cardsController.reset()
        this.fieldsController.reset()
        this.strategyController?.stop()
    }

    stopImmediately = () => {
        this.logAction({ action: LOG_ACTIONS.stop_turn })
        this.stop()
    }
}

const MAX_ACTIVATION_ITERATION = 3
const MAX_SPAWN_ITERATION = 3

export class Spawn extends SequentialStrategy {
    code: GameStrategyCodeType = GameStrategyCodeType.spawn

    private choosePlace = (data: MobData | null, i: number , cb: Function) => {
    
        if (data) {
            const fieldHandler = (field: Field) => {
                this.spawnElemental(field, data) 
                this.logAction({ type: 'extra', action: LOG_ACTIONS.spawned, target: data.code })
                cb()
            }
            if (i === 0) {
                this.fieldsController.getUserAnyLastEmptyFieldAsync(this.turn.currentTurn ,[], fieldHandler)
            } else if (i === 1) {
                this.fieldsController.getLastNeighBoorsAndCurrentEmptyFieldAsync(this.interactedFields[0], fieldHandler)
            } else {
                this.fieldsController.getNeighBoorLastEmptyFieldAsync(this.interactedFields, fieldHandler)
            }   
        } else {
            this.stop()
        }
    }

    private spawnElemental = (field: Field | null, data: MobData | null) => {
        if (field && data) {
            field!.createElemental(data) 
            field!.elemental?.guild.spawn(field!, this.fieldsController, this.killer, this.cardsController, () => {
                this.interactedFields.push(field!)
            })
        }
    }

    private isEnd = (i: number) => {
        return i >= Math.max(MAX_SPAWN_ITERATION, this.cardsController.hand.cards.length)
    }

    private iterate = (index: number, cb: Function) => {
        if (!this.isEnd(index)) {

            this.logAction({ action: LOG_ACTIONS.start_action_iteration, type: 'util'})

            this.index = index
            const recurse = () => this.iterate(index + 1, cb)
            if (this.activeValue) {
        
                this.cardsController.getCardsSameValueAsync(this.activeValue, data => {
                   this.choosePlace(data, index, recurse)
                })
        
            
            } else if (this.activeGuild) {
                this.cardsController.getCardsSameGuildAsync(this.activeGuild, data => this.choosePlace(data, index, recurse))
            }
        } else {
            cb()
        }
    }

    startAction = () => {
        if (this.data) {
            this.logAction({ action: LOG_ACTIONS.spawnBy(this.interactType), target: this.data.code})
            this.choosePlace(this.data, 0, () => {
                this.iterate(1, this.stop)
            })
        }
    }


    highlightByGuild(): void {
        this.cardsController.highlightCardsSameGuild(this.data.guild)
    }

    highlightByValue(): void {
        this.cardsController.highlightCardsByValue(this.data.value)
    }
}

export class Activation extends SequentialStrategy {
    code: GameStrategyCodeType = GameStrategyCodeType.activate

    private activateELemental = (field: Field | null, cb: Function) => {
        if (field) {
            field!.elemental?.guild.activate(field!, this.fieldsController, this.killer, this.cardsController, () => {
                this.interactedFields.push(field)
                this.logAction({ type: 'extra', action: LOG_ACTIONS.activated, target: field.code })
                cb()
            })
        } else {
            this.stop()
        }
    }

    private iterate = (index: number, cb: Function) => {
        if (index < MAX_ACTIVATION_ITERATION) {
            this.index = index
            const recurse = () => this.iterate(index + 1, cb)
            if (this.activeValue !== null) {
                this.fieldsController.getTeamElementalsByValueAsync(this.turn.currentTurnTeam, this.data, this.interactedFields, field => {
                    this.activateELemental(field, recurse)
                }, { autoReturn: false })
            } else {
                this.fieldsController.getTeamElementalByGuildAsync(this.turn.currentTurnTeam, this.data, this.interactedFields, field => {
                    this.activateELemental(field, recurse)
                }, {
                    autoReturn: false
                })
            }
        } else {
            cb()
        }
    }

    startAction = () => {
        if (this.data) {
            this.cardsController.left.add(this.data)
            this.logAction({ action:  LOG_ACTIONS.activateBy(this.interactType), target: this.data.code })
            this.iterate(0, this.stop)
        }
    }

    highlightByGuild(): void {
        this.fieldsController.highLightTeamElementalsByGuild(this.turn.currentTurnTeam, this.data, [])
    }

    highlightByValue(): void {
        this.fieldsController.highlightTeamElementalsByValue(this.turn.currentTurnTeam, this.data, [])
    }
}



export class DraftContentBuilder {
    usersDraft: Map<User, UserDraft> = new Map<User, UserDraft>()
    guilds: GuildsPoolController = new GuildsPoolController()
    draftStages: DraftStage[] = [DraftStage.pick]
    private users: UsersStorage

    constructor(users: UsersStorage) {
        this.users = users
        this.formatGuildDrafts()
    }

    parseUserDrafts = (data: Map<User, ServerUserPicks>) => {
        data.forEach((picks, user) => {
            this.usersDraft.set(user, UserDraftMapper.toDomain(picks))
        })

        return this
    }

    parseGuildsPool = (guilds: GuildCode[]) => {
        this.guilds.setGuilds(this.getGuildSet(guilds))

        return this
    }

    formatGuildsPool = (withExtension: boolean) => {
        const withBan = this.draftStages.includes(DraftStage.ban)
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
            if (this.guilds.guilds.length >= Array.from(this.usersDraft.keys()).length) {
                teams.forEach(team => {
                    team.users.forEach(user => {
                        this.usersDraft
                            .get(user)
                            ?.choose(this.guilds.takeRandomGuildSync()!)
                    })
                })
            }
        }

        return this
    }

    setMaxCountOfGuildsPerUser = (maxGuildsCountPerPlayer?: number) => {
        const leftGuildsPerStage = this.maxCountPlayersPerTeam * this.users.teams.length
        const countOfBanStagesPerRound = this.draftStages.reduce((acc, stage) => stage === DraftStage.ban ? acc + 1 : acc ,0)
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
            this.draftStages = withBan ? [DraftStage.pick, DraftStage.ban] : [DraftStage.pick]
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
                    if (stage === DraftStage.pick) {
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




class ActionController implements StrategyController {
    strategy: ActionStrategy | null = null
    onFinish: ((needRepeate: boolean) =>  void) | undefined
    logAction: LogAction | undefined

    setLogAction = (action: LogAction): void => {
        this.logAction =  action
    }

    setStrategy = (strategy: ActionStrategy | null) => {
        this.strategy = strategy

        if (this.strategy) {
            this.strategy.setController(this)
            
            if (this.logAction) {
                this.strategy.setLogAction(this.logAction)
            }
        }   
    }

    start = (cb?: (value: boolean) => void) => {
        if (this.strategy) {
            this.onFinish = cb
            this.strategy.start()            
        }
    }

    stop = (needRepeat?: boolean) => {
       this.strategy = null

       if (this.onFinish) {
            this.onFinish(!!needRepeat)
       }
    }

    get hasStrategy () {
        return !!this.strategy
    }
}


export abstract class Stage<Prev = object, Def = unknown, NextInput = object> {
    code: StageCode | InGameCode
    controller: IStageController
    next: Stage<NextInput> | null = null
    defaultData: Def | undefined
    loading: boolean = false
    isBigDaddy: boolean = true

    constructor(code: StageCode | InGameCode, controller: IStageController, isBigDaddy: boolean, def?: Def) {
        this.code = code
        this.controller = controller
        this.isBigDaddy = isBigDaddy
        this.defaultData = def
        this.setDefaultData.bind(this)
        this.stop.bind(this)
        makeObservable(this, {
            loading: observable
        })
    }

    setDefaultData(data?: Def) {
        this.defaultData = data
    }

    setBigDaddyStatus = (status: boolean) => {
        this.isBigDaddy = status
    }

    setLoading = (status: boolean) => {
        this.loading = status
    }

    setStageController = (controller: IStageController) => {
        this.controller = controller
    }

    setNext = (stage: Stage<NextInput>) => {
        this.next = stage
    }

    stop = () => {
        if (this.isBigDaddy) {
            if (this.next) {
                this.controller.setStage(this.next as any)
                this.next.start(this.formatDataForNextStage())
            } else {
                this.controller.stop()
            }
        }
    }

    formatDataForNextStage = (): NextInput | undefined => {
        return undefined
    }

    abstract start(prev?: Prev): void
}

export abstract class InGameStage<Prev = unknown, Def = unknown> extends Stage<Prev, Def> {
    readonly turn: Turn
    readonly logActionHandler: LogAction | undefined

    constructor(code: InGameCode, controller: IStageController, turn: Turn, isBigDaddy: boolean, logAction?: LogAction, def?: Def) {
        super(code, controller, isBigDaddy, def)
        this.defaultData = def
        this.turn = turn
        this.logActionHandler = logAction
        this.start.bind(this)
    }

    start(_?: Prev): void {
        if (this.logActionHandler) {
            this.logActionHandler({
                instigator: { 
                    type: LogInstigatorType.user,
                    target: this.turn.currentTurn.id
                },
                action: LOG_ACTIONS.start_stage,
                target: this.code
             })
        }
    }

    stop = () => {
        if (this.logActionHandler) {
            this.logActionHandler({
                instigator: { 
                    type: LogInstigatorType.user,
                    target: this.turn.currentTurn.id
                },
                action: LOG_ACTIONS.stop_stage,
                target: this.code
             })
        }
        super.stop()
    }

    abstract setLogAction(action: LogAction): void

    logAction = (log: LogPayload) => {
        this.logActionHandler && this.logActionHandler(log)
    }

    abstract setEnabled(status: boolean): void
}

export class Draft extends InGameStage<DraftConfig, DefaultPicks> {
    guilds: GuildsPoolController = new GuildsPoolController()
    private stagesTemplate: DraftStage[] = []
    private currentStageIndex: number = 0
    usersDraft: Map<User, UserDraft> = new Map()

    constructor(turn: Turn, controller: IStageController, isBigDaddy: boolean, logAction?: LogAction, picks?: DefaultPicks) {
        super(InGameCode.draft, controller, turn, isBigDaddy, logAction, picks)
        makeObservable(this, {

        })
        logAction && this.setLogAction(logAction)
        this.start.bind(this)
    }

    setLogAction = (action: LogAction) => {
        this.logAction = action   
        this.guilds.setLogAction(action)
    }

    setEnabled = (status: boolean): void  => {
        this.guilds.setEnabled(status)
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

    get currentStage(): DraftStage {
        return this.stagesTemplate.length === 0
            ? DraftStage.pick
            : this.stagesTemplate[this.currentStageIndex]
    }

    get hasBanStage() {
        return this.stagesTemplate.includes(DraftStage.ban)
    }

    setRandomDrafts = () => {
        while(!this.isEnd()) {
            if (this.guilds.guilds.length > 0) {
                this.currentUserDraft().choose(this.guilds.takeRandomGuildSync()!)
                this.turn.next()
            }
        } 
    }

    isEnd = () => {
        return [...this.usersDraft.values()].every(draft => draft.isDraftFull)
    }

    formatDataForNextStage = () => {
        return this.usersDraft
    }

    processIterate = (cb?: Function) => {
        if (this.turn.isMyTurn) {
            this.guilds.setHighlightable(true)
            this.guilds.setClickable(true)
        }

        this.guilds.getGuildAsync(guild => {
            if (!guild) {
                return this.stop()
            }

            if (this.currentStage === DraftStage.pick) {
                this.logAction({ type: 'extra', action: LOG_ACTIONS.pick, target: guild.code })
                this.currentUserDraft().choose(guild)
            } else {
                this.logAction({ type: 'extra', action: LOG_ACTIONS.ban, target: guild.code })
                this.currentUserDraft().ban(guild)
            }
            
            this.turn.next()
            this.guilds.setHighlightable(false)
            this.guilds.setClickable(false)
           
            if (this.turn.currentTurn === this.turn.firstTurnUser) {
                this.nextStage()
            }

            cb && cb()
        })
    }

    takeAllGuilds = (cb: Function) => {
        if (!this.isEnd()) {
            this.processIterate(() => this.takeAllGuilds(cb))
        } else {
            cb()
        }
    }

    start(config?: DraftConfig) {
        super.start()
        const builder = new DraftContentBuilder(this.turn)
        this.stagesTemplate = config?.draftTemplates || [DraftStage.pick]

        if (this.defaultData) {
            builder
                .parseGuildsPool(this.defaultData.total)
                .parseUserDrafts(this.defaultData.users)
        } else {
            builder
                .formatGuildsPool(config?.withExtension || false)
                .setMaxCountOfGuildsPerUser(config?.guildsPerPlayer)
        }
 
        this.guilds = builder.guilds
        this.usersDraft = builder.usersDraft
        this.guilds.setLogAction(this.logAction)

        this.takeAllGuilds(() => {
            this.stop()
        })
    }
}


export class GameProcess extends InGameStage<Map<User, UserDraft>, DefaultProcessGameState> {
    points: PointsManager
    gameField: FieldsController = new FieldsController()
    killer: Killer
    usersCards: UsersCards = new Map()
    action: ActionController = new ActionController()

    constructor(turn: Turn, controller: IStageController, isBigDaddy: boolean, logActionFunction?: LogAction, defaultState?: DefaultProcessGameState) {
        super(InGameCode.process, controller, turn, isBigDaddy, logActionFunction)
        this.defaultData = defaultState
        this.points = new PointsManager(turn)
        this.killer = new Killer(this.usersCards, this.points)
        logActionFunction && this.setLogAction(logActionFunction)
        this.start.bind(this)
    }

    setEnabled = (status: boolean) => {
        this.usersCards.forEach(controller => controller.setEnabled(status))
        this.gameField.setEnabled(status)
    }

    setLogAction = (action: LogAction): void => {
        this.usersCards.forEach(controller => {
            controller.setLogAction(action)
        })
        this.gameField.setLogAction(action)
        this.action.setLogAction(action)
        this.killer.setLogAction(action)
    }

    currentDeck = () => {
        return this.getCertainUserDeck(this.turn.currentTurn)!
    }

    isEnd = () => {
        return this.points.isEndOfTheGame
    }

    iterate = (cb: Function) => {
        if (!this.isEnd()) {
            if (this.turn.isMyTurn) {
                this.gameField.setHighlightable(true) 
                this.gameField.setClickable(!this.turn.isGuest)   
                this.currentDeck().setClickable(!this.turn.isGuest)
                this.currentDeck().setClickable(true)

                this.interactWithCard(() => {
                    this.turn.next()
                    this.iterate(cb)
                })
            } else {
                this.gameField.setHighlightable(false)
                this.gameField.setClickable(false)
                this.currentDeck().setClickable(false)
                this.currentDeck().setClickable(false)
            }
        } else {
            cb()
        }
    }

    start(drafts?: Map<User, UserDraft>) {
        super.start(drafts)

        if (drafts || this.defaultData) {
            const builder = new GameContentBuilder(this.turn)

            if (drafts && this.turn.isMyTurn) {
                builder
                    .createGameField()
                    .formatInitDecks(drafts)
                    .addCardToCenter()
            } else if (this.defaultData) {
                this.points.setPoints(this.defaultData.points)

                builder
                    .createGameField(this.defaultData.fields)
                    .parseUserDecks(this.defaultData.cards)
            }

            this.gameField = builder.gameField
            this.usersCards = builder.userCards

            if (this.logActionHandler) {
                this.usersCards.forEach(controller => {
                    controller.setLogAction(this.logActionHandler!)
                })
                this.gameField.setLogAction(this.logActionHandler)
            }
    
            this.iterate(() => {
                this.stop()
            })
        }
    }

    getCertainUserDeck = (user: User): CardsController => {
        return this.usersCards.get(user)!
    }

    setStrategy = (strategy: ActionStrategy | null) => {
        this.action.setStrategy(strategy)
    }

    setActivation = (mobData: MobData) => {
        this.setStrategy(new Activation(this.currentDeck(), this.killer, this.gameField, mobData, this.turn))
    }

    setDraw = () => {
        this.setStrategy(new Draw(this.currentDeck(), this.points, this.gameField, this.turn))
    }

    setSpawn = (mobData: MobData) => {
        this.setStrategy(new Spawn(this.currentDeck(), this.killer, this.gameField, mobData, this.turn))
    }

    interactWithCard = (cb: Function) => {
        this.currentDeck().getSomeCardCommandAsync(({ message, target }) => {
            switch (message) {
                case LOG_ACTIONS.activate:
                    this.setActivation((target as Card).mobData)
                    break
                case LOG_ACTIONS.summon:
                    this.setSpawn((target as Card).mobData)
                    break
                case LOG_ACTIONS.draw:
                    this.setDraw()
                    break
            }
            this.action.start(needRepeat => {
                if (needRepeat) {
                    return this.interactWithCard(cb)
                } else {
                    cb()
                }
            })
        })
    }
}

// export type DraftConfig = Partial<{
//     withExtension: boolean
//     withBan: boolean
//     draftTemplates: DraftStage[]
//     guildsPerPlayer: number
// }>



export class UserWithReadyStatus extends User {
    ready: boolean = false

    constructor(user: User, ready: boolean = false) {
        super(user.id, user.name, user.email, user.avatar, user.rating)
        this.ready = ready

        makeObservable(this, {
            ready: observable,
            setReady: action
        })
    }

    setReady = (status: boolean) => {
        this.ready = status
    }
}



const initData: ServerRoomPropsPayload = {
    withExtension: false,
    playersCount: 2,
    draftStages: [DraftStage.pick],
    name: '',
    password: null,
    type: RoomType.public
}


export class GameRoomPropsController {
    canEdit: boolean = true
    playersCount: number = initData.playersCount
    withExtension: boolean = initData.withExtension
    draftStages: DraftStage[] = initData.draftStages
    name: string = initData.name
    password: ValidationField = new ValidationField(initData.password, yup.string().min(3) )
    type: RoomType = initData.type
    initData: ServerRoomPropsPayload

    constructor(data?: ServerRoomPropsPayload, canEdit?: boolean) {
        this.initData = data || initData
        this.canEdit = canEdit || true
        makeAutoObservable(this)
        data && this.setData(data)
    }

    setCanEdit = (status: boolean) => {
        this.canEdit = status
    }

    updateInitData = () => {
        this.initData = {
            ...this,
            password: this.password.data as string,
        }
    }

    setData = ({ withExtension, draftStages, name, playersCount, type, password }: ServerRoomPropsPayload) => {
        this.withExtension = withExtension
        this.draftStages = draftStages
        this.playersCount = playersCount
        this.password.setValue(password)
        this.type = type
        this.name = name
    }

    patchData = ({ withExtension, draftStages, name, playersCount, type, password }: Partial<ServerRoomPropsPayload>) => {
        this.withExtension = withExtension || this.withExtension
        this.draftStages = draftStages || this.draftStages
        this.playersCount = playersCount || this.playersCount
        password && this.password.setValue(password) 
        this.type = type || this.type
        this.name = name || this.name
    }

    resetData = () => {
        this.setData(this.initData)
    }

    setInitData = (data: ServerRoomPropsPayload) => {
        this.initData = data
    }

    setPlayersCount = (value: 2 | 3 | 4) => {
        if ([2, 3, 4].includes(value) && this.canEdit) {
            this.playersCount = value

            this.setWithExtension(true)
        }
    }

    setRoomType = (roomType: RoomType) => {
        if (this.canEdit) {
            this.type = roomType

            if (this.type === RoomType.public) {
                this.password.setValue(null)
            }
        } 
    }

    addStage = (stage: DraftStage) => {
        if (this.canEdit) {
            this.draftStages.push(stage)

            if (stage === DraftStage.ban) {
                this.setWithExtension(true)
            }
        }
    }

    setWithExtension = (value: boolean) => {
        const canSet = ((this.withBan && value) || !this.withBan
           || (this.playersCount > 2 && value) || this.playersCount === 2) && this.canEdit

        if (canSet) {
            this.withExtension = value
        } 
    }

    get withBan () {
        return this.draftStages.includes(DraftStage.ban)
    }

    deleteStage = (index: number) => {
        if (this.canEdit) {
            this.draftStages = this.draftStages.filter((_, i) => i !== index)
        }
    }

    get maxPlayersPerTeam () {
        return Math.ceil(this.playersCount / 2)
    }
}

type GameRoomDefaultData = {
    teams: Team<UserWithReadyStatus>[]
    props: GameRoomPropsController
    owner: User
    saved: boolean
    blackList: string[]
    admins: string[]
}

export class GameRoom extends Stage<any, GameRoomDefaultData, PrevState> {
    teams: Team<UserWithReadyStatus>[] = []
    owner: User
    private api: IGameAPI
    currentUser: UserWithReadyStatus
    props: GameRoomPropsController
    blackList: string[] = []
    saved: boolean = false
    private onUserKick: undefined | Function
    admins: string[] = []

    constructor (controller: IStageController, owner: User, api: IGameAPI, currentUser: User, isBigDaddy: boolean, def?: GameRoomDefaultData) {
        super(StageCode.room, controller, isBigDaddy, def)
        this.owner = owner
        this.api = api
        const defaultUser = def ? def.teams.map(({ users }) => users).flat().find(({ id }) => id === currentUser.id) : null
        this.currentUser = defaultUser || new UserWithReadyStatus(currentUser)
        this.props = new GameRoomPropsController(undefined, this.isOwner)
        this.api.onChangeReadyStatus(this.applyReadyStatus)
        this.api.onJoinTeam(this.applyUserJoin)
        this.api.onLeaveTeam(this.applyUserLeave)
        this.api.onKickUser(this.applyKickUser)
        this.api.onChangeAdmins(this.applyAdminsChange)

        const changeReady = () => {
            let timer: any
            let startStatus = this.meReady

            return async (status: boolean) => {              
                try {
                    this.currentUser.setReady(status)
                    clearTimeout(timer)
                    
                    if (status !== startStatus) {
                        timer = setTimeout( async () => {
                            
                            await this.api.setReadyStatus(status)
                            console.log(status + 'sdfdsdf')
                            startStatus = status

                        }, 400)
                    }
                } catch (e) {}
            }
        }

        this.setReadyStatus = changeReady()

        makeObservable(this, {
            meReady: computed,
            teams: observable,
            blackList: observable,
            saved: observable,
            admins: observable,
            setReadyStatus: action
        })
    }

    setOwner = (user: User) => {
        this.owner = user
    }

    private getUserByEmail = (email: string) => {
        return this.users.find((user) => user.email === email)
    }

    applyAdminsChange = (email: string, reverse: boolean) => {
        const user = this.getUserByEmail(email)

        if (user) {
            user.setType(reverse ? UserType.user : UserType.moderator)
        }
    }

    saveRoom = async () => {
       this.saved = true
       await this.api.saveRoom()
    }

    undoSaveRoom = async () => {
        this.saved = false
        await this.api.undoSaveRoom()
    }

    toggleRoomSave = () => {
        if (this.saved) {
            this.undoSaveRoom()
        } else {
            this.saveRoom()
        }
    }

    changeAdmins = async (email: string, reverse: boolean) => {
        await this.api.changeAdmin(email, reverse)
    }

    get users () {
        return this.teams.map(user => user.users).flat()
    }

    applyKickUser = (email: string) => {
        const user = this.getUserByEmail(email)

        if (user) {
            NotificationService.getInstance().addNotification({
                type: NotificationType.info,
                message: `Пользователь ${user.name} был кикнут из комнаты`
            })

            this.removeUserByEmail(email)

            if (email === this.currentUser.email) {
                this.onUserKick && this.onUserKick()
            }
        }
    }

    subscribeOnUserKick = (cb: Function) => {
        this.onUserKick = cb
    }

    private removeUserByEmail = (email: string) => {
        this.teams.forEach(team => {
            team.users = team.users.filter(user => user.email !== email)
        })
    }

    kickUser = async (email: string, withBan = false) => {
        if (this.isOwner) {
            const backup = this.teams
            try {
                this.removeUserByEmail(email)

                if (withBan) {
                    this.blackList.push(email)
                }

                await this.api.kickUser(email, withBan)
            } catch (e) {
                this.teams = backup
            }
        }
    }

    undoBan = async (email: string) => {
        if (this.isOwner) {
            const backup = this.blackList
            try {
                this.blackList = this.blackList.filter(userEmail => userEmail !== email)
                await this.api.undoBanUser(email)
            } catch (e) {
                this.blackList = backup
            }
        }
    }

    applyEditProps = async (data: Partial<ServerRoomPropsPayload>) => {
        this.props.patchData(data)
        this.props.updateInitData()
    }

    applyReadyStatus = (userId: string, status: boolean) => {
        this.teams.map(team => team.users).flat().find(user => user.id === userId)?.setReady(status)
    }

    applyUserLeave = (userId: string) => {
        this.teams = this.teams.map(team => {
            team.removeUserById(userId)
            return team
        })
    }

    applyUserJoin = (user: ServerUser, teamId: string) => {
        this.addUserToTeam(UserMapper.toDomain(user), teamId)
    }

    private startLoading = () => {
        this.loading = true
    }

    private stopLoading = () => {
        this.loading = false
    }

    editProps = async (data: Partial<ServerRoomPropsPayload>) => {
        try {
            this.startLoading()
            await this.api.editProps(data)
            this.props.patchData(data)
            this.props.updateInitData()
            this.stopLoading()
        } catch (_) {
            this.stopLoading()
            this.props.resetData()
        }
    }

    setReadyStatus = async (_: boolean) => {}

    toggleReadyStatus = async () => {
        await this.setReadyStatus(!this.meReady)
    }
    
    get meReady () {
        return this.currentUser.ready
    }

    start(): void {    
        if (this.defaultData) {
            this.teams = this.defaultData.teams
            this.props = this.defaultData.props
            this.owner = this.defaultData.owner
            this.blackList = this.defaultData.blackList
            this.saved = this.defaultData.saved
            this.admins = this.defaultData.admins
        }  
    }

    connectToTeam = async (team: Team) => {
        try {
            await this.api.joinTeam(team.id)
            this.addUserToTeam(this.currentUser, team.id)
        } catch (e) {
            console.log(e)
        }
    }

    addBotToTeam = (team: Team) => {
        this.addUserToTeam(this.currentUser, team.id)
    }

    connectToRandomTeam = () => {
        this.connectToTeam(getRandomElement(this.availableToConnectTeams))
    }

    leaveTeam = async () => {
        try {
            await this.api.leaveTeam()
            this.teams = this.teams.map(team => {
                team.removeUserById(this.currentUser.id)
                return team
            })
        } catch (_) {}
    }

    get canStart() {
        return this.currentCountOfPlayers === this.props.playersCount
            && this.teams.every(team => team.users.every(({ ready  }) => ready))
    }

    checkCanAddUserToTeam = (team: Team<any>) => {
        return team.users.length < this.props.maxPlayersPerTeam 
    } 

    addUserToTeam = (user: User, teamId: string) => {
        const foundTeam = this.teams.find(t => t.id === teamId)

        if (foundTeam && this.checkCanAddUserToTeam(foundTeam!)) {
            foundTeam.addUser(new UserWithReadyStatus(user))
        }     
    }

    formatDataForNextStage = (): PrevState => {
        return {
            users: new UsersStorage(this.teams as any, this.currentUser),
            config: {
                withExtension: this.props.withExtension,
                draftTemplates: this.props.draftStages
            }
        }
    }

    get canAddUser() {
        return this.currentCountOfPlayers < this.props.playersCount
    }

    get availableToConnectTeams () {
        return this.teams.filter(this.checkCanAddUserToTeam)
    }

    get freeTeams () {
        return this.teams
    }

    get isConnectedToRoom() {
        return !!this.myTeam
    }

    get myTeam() {
        return this.teams.find(team => team.users.some(user => user.id === this.currentUser.id)) || null
    }

    get isOwner() {
        return this.currentUser.id === this.owner.id
    }

    get currentCountOfPlayers () {
        return this.teams.reduce((acc, t) => acc + t.playersCount, 0)
    }
}


// export class GameEnd extends Stage<User, InGameStageControllerDefaultData> {
//     constructor (controller: InGameStageController) {
//         super( controller)
//     }

//     start(): void {
        
//     }

//     restart = () => {
//         // this.stageController.setGameStage()
//     }

//     goToRoomMenu = () => {
//         // this.stageController.setGameStage()
//     }
// }

const START_POINT = 0


export class Timer {
    seconds: number
    private timer: any
    sideEffect: TimerChangeTimeSideEffect | undefined

    constructor(startSeconds?: number) {
        this.seconds = startSeconds || START_POINT
        makeAutoObservable(this)
    }

    setOffsetAccordingStartDate = (date: number) => [
        this.setOffset(this.seconds + Math.floor((Date.now() - new Date(date).getTime()) * 1000))
    ]

    setSideEffect = (sideEffect: TimerChangeTimeSideEffect) => {
        this.sideEffect = sideEffect
    }

    setOffset = (offset: number) => {
        this.seconds = offset
    }

    start = () => {
        this.timer = setInterval(() => {
            this.seconds += 1
            this.sideEffect && this.sideEffect(this.seconds)
        }, 1000)
    }

    pause = () => {
        clearInterval(this.timer)
        this.timer = null
    }

    reset = () => {
        this.pause()
        this.seconds = START_POINT
    }

    get time () {
        const minutes = Math.floor(this.seconds / 60)
        const hours = Math.floor(this.seconds / 3600)
        const seconds = this.seconds -  hours * 3600 - minutes * 60

        const getTimeValue = (v: number) => v.toString().padStart(2, '0') 

        return [getTimeValue(hours), getTimeValue(minutes), getTimeValue(seconds)].join(':')
    }
}

export class Logger {
    logs: Log[] = []
    private selectedLog?: string | null = null
    protected onLogActionEffect: LogSideEffect | null = null
    protected onAddLogEffect: LogSideEffect | null = null
    protected enabled: boolean = true
    protected timer: Timer | null = null

    constructor(timer?: Timer) {
        this.timer = timer || null
    }

    setTimer = (timer: Timer | null) => {
        this.timer = timer
    }

    setEnabled = (status: boolean) => {
        this.enabled = status
    }

    selectLog = (log: Log) => {
        this.selectedLog = log.id
    }

    setLogActionSideEffect = (action: LogSideEffect | null) => {
        this.onLogActionEffect = action
    }

    setAddLogSideEffect = (action: LogSideEffect | null) => {
        this.onAddLogEffect = action
    }
    
    logAction = ({ type, action, instigator, target }: LogPayload, sideEffect?: (log: Log) => void) => {
        if (this.enabled) {            
            const defaultActionInstigator: LogInstigator = { target: null, type: LogInstigatorType.system }

            const payload: Log = {
                id: uuid(),
                type: type || 'util',
                action,
                instigator:  instigator || defaultActionInstigator,
                target: target || null,
                date: new Date().toLocaleDateString(),
                timestamp: this.timer ?
                    { seconds: this.timer.seconds,
                    UTC: this.timer.time }
                : undefined,
                nested: [],
            }

            this.addLog(payload, this.selectedLog, false)
            this.logs.push(payload)
            
            if (sideEffect) {
                sideEffect(payload)
            } else if (this.onLogActionEffect) {
                this.onLogActionEffect(payload)
            } 
        }
    }

    addLog = (log: Log, toLog?: string | null, ignoreSideEffect?: boolean) => {
        if (this.onAddLogEffect && !ignoreSideEffect) {
            this.onAddLogEffect(log)
        }

        if (toLog) {
            this.logs.find(log => log.id === toLog)?.nested.push(log)
        } else {
            this.logs.push(log)
        }
    }

    setLogs = (logs: Log[]) => {
        this.logs = logs
    }   
}


abstract class Bot extends User {
    private stageController: InGameStageController | undefined
    private enabled: boolean = true
    
    constructor(id: string, name: string) {
        super(id, name, '', null, 0, UserType.bot)
    }

    setEnabled = (status: boolean) => {
        this.enabled = status
    }

    setStageController = (controller: InGameStageController) => {
        this.stageController = controller
    }

    move = () => {
        if (this.enabled && this.stageController) {
            if (this.stageController.getStage().code === InGameCode.draft) {
                this.moveInDraftStage(new DraftFacade(this.stageController.getStage() as Draft))
            }
    
            if (this.stageController.getStage().code === InGameCode.process) {
                this.moveInGameProcessStage(new GameProcessFacade(this.stageController.getStage() as GameProcess))
            }
        }
    }

    protected abstract moveInDraftStage(stage: DraftFacade): void
    protected abstract moveInGameProcessStage(stage: GameProcessFacade): void
}

export class FoolishBot extends Bot {
    constructor(name?: string) {
        super(uuid(), name || 'Fool')
    }

    protected moveInGameProcessStage = (stage: GameProcessFacade) => {
        const spawn = () => {
            let fieldsForStartSpawn: Field[] = []

            stage.getCurrentTurnUserFields().forEach(fields => {
                if (fields.length === 1) {
                    fieldsForStartSpawn.push(fields[0])
                }
            })
            
            if (fieldsForStartSpawn.length > 0) {
                getRandomElement(fieldsForStartSpawn).select()
            } else {
                stage.selectRandomField()
            }

            const availableElementalsForSpawn = stage.getCurrentTurnAvailableCards().length

            for (let i = 1; i < Math.min(availableElementalsForSpawn, MAX_SPAWN_ITERATION); i++) {
                stage.selectRandomCard()
                selectFieldsUnitActionIndexChanged()
            }
        }

        const activate = () => {
            const availableElementalsForActivation = stage.getAvailableFields().length

            for (let i = 0; i < Math.min(availableElementalsForActivation, MAX_ACTIVATION_ITERATION); i++) {
               selectFieldsUnitActionIndexChanged()
            }
        }

        if (stage.getCurrentTurnHandCards().length === 0) {
            return stage.draw()
        }

        const availableActions: Function[] = []

        const addAction = (action: Function, priority: number = 1) => {
            for (let i = 0; i < priority; i++) {
                availableActions.push(action)
            }
        }

        const countPointsForDraw = stage.getCountPointsForDraw() 

        if (countPointsForDraw > 0) {
            addAction(stage.draw, countPointsForDraw >= 2 ? 10 : 2)
        }

        const data = new Map<MobData, { guild: number, value: number }>()
        const hand = stage.getCurrentTurnHandCards()

        hand.forEach(card => {
            data.set(card.mobData, this.getCountOfElementalsByGuildAndValue(stage, card.mobData))
        })
        
        hand.forEach(card => {
            const activateByGuild = () => {
                stage.activateCardByCode(card.mobData.code, 'guild')
                activate()
            }
            const activateByValue = () => {
                stage.activateCardByCode(card.mobData.code, 'value')
                activate()
            }
            
            const stat = data.get(card.mobData)

            if (stat!.guild > 0) {
                addAction(activateByGuild, 2)
            }

            if (stat!.value > 0) {
                addAction(activateByValue, 2)
            }
        })
        
        hand.forEach(card => {
            const spawnByGuild = () => {
                stage.spawnCardByCode(card.mobData.code, 'guild')
                spawn()
            }
            const spawnByValue = () => {
                stage.spawnCardByCode(card.mobData.code, 'value')
                spawn()
            }

            addAction(spawnByValue)
            addAction(spawnByGuild)
        })

        getRandomElement(shuffleArray(availableActions))()

        const stopTurn = () => {
            if (Math.random() > 0.85) {
                stage.stopTurn()
            }
        }

        const selectFieldsUnitActionIndexChanged = () => {
            const currentIndex = stage.getSequentialActionIterationIndex()
            stage.selectRandomField()

            while (stage.getSequentialActionIterationIndex() === currentIndex && stage.getAvailableFields().length > 0) {
                stage.selectRandomField()
            }

            stopTurn()
        }
    }

    private getCountOfElementalsByGuildAndValue = (stage: GameProcessFacade, data: MobData) => {
        const stat = { guild: 0, value: 0 }

        stage.getCurrentTurnUserFields().forEach(fields => {
            fields.forEach(field => {
                if (field.elemental) {
                    if (field.elemental.mobData.guild.code === data.guild.code) {
                        stat.guild += 1
                    }

                    if (field.elemental.mobData.value === data.value) {
                        stat.value += 1
                    }
                }
            })
        })

        return stat
    }

    protected moveInDraftStage = (stage: DraftFacade) => {
        stage.takeRandomGuild()
    }
}


abstract class GameAPI implements IGameAPI {
    protected roomId: string
    protected callbacks: Record<string, Function[]> = {}
    private loadings: Record<string, boolean> = {} 

    constructor(roomId: string) {
        this.roomId = roomId
    }
    abstract getGameState(): Promise<Pick<ServerGameState, 'logs' | 'teams' | 'guilds'>>
    
    protected setLoading = (key: string, status: boolean) => {
        this.loadings[key] = status
    }

    getLoadings = (key: string) => {
        return this.loadings[key] || false
    }

    protected saveCallback = (key: string, callback: Function) => {
        this.callbacks[key] = (this.callbacks[key] || [])
        this.callbacks[key].push(callback)
    }

    protected callAllCallbacks = (key: string, args: any) => {
        this.callbacks[key]?.forEach(cb => cb(...args))
    }

    abstract changeAdmin(email: string, reverse: boolean): Promise<void>
    abstract onChangeAdmins(cb: (email: string, reverse: boolean) => void): void
    abstract saveRoom(): Promise<void>
    abstract undoSaveRoom(): Promise<void>
    abstract onKickUser(cb: (userId: string) => void): void
    abstract undoBanUser(userId: string): Promise<void>
    abstract kickUser(userId: string, withBan: boolean): Promise<void>
    abstract onChangeReadyStatus(cb: (userId: string, status: boolean) => void): void
    abstract onEditProps(cb: (data: Partial<ServerRoomPropsPayload>) => void): void
    abstract onJoinTeam(cb: (user: ServerUser, teamId: string) => void): void
    abstract onLeaveTeam(cb: (userId: string) => void): void
    abstract joinTeam(teamId: string): Promise<void>
    abstract leaveTeam(): Promise<void>
    abstract setReadyStatus(status: boolean): Promise<void>
    abstract onGameStateChange(cb: (data: Pick<ServerGameState, 'logs' | 'teams' | 'guilds'>) => void): void
    abstract pause(payload: { initiatorId: string } & { paused: boolean; periodStart: number; currentDuration: number }): Promise<void>
    abstract onPause(cb: (data: { initiatorId: string } & { paused: boolean; periodStart: number; currentDuration: number }) => void): void
    abstract getState(): Promise<ServerFinalState> 
    abstract setGameState(state: GameStatePayload): Promise<void>
    abstract connect(userId: string, cb: () => void): Promise<void> 
    abstract startStage(stage: InGameCode, payload: GameStatePayload): Promise<void> 
    abstract onStartStage(cb: (data: ServerFinalState) => void): void
    abstract disconnect(cb: () => void): Promise<void>
    abstract sendLog(log: Log): void 
    abstract getLog(cb: (log: Log) => void): void 
    abstract editProps(state: Partial<ServerRoomPropsPayload>): Promise<void>
}

type WebsocketResponse = { 
    message: string
    status: string
}

export class WebSocketGameAPI extends GameAPI {
    socket: any
    api: HTTPAxiosAPI 

    constructor(roomId: string) {
        super(roomId)
        this.api = new HTTPAxiosAPI(`/rooms/${this.roomId}`)
    }

    private operateError = (err: WebsocketResponse) => {
        if (err) {
            
        }
    }

    private throwError = (err: WebsocketResponse, reject: (err: Error) => void) => {
        if (err.status === 'error') {
            reject(new Error(err.message))
        }
    }

    

    pause = (_: { initiatorId: string } & { paused: boolean; periodStart: number; currentDuration: number }): Promise<void> => {
        return new Promise((res, rej) => {
            this.socket.emit(WEBSOCKET_EVENTS.togglePause, this.operateResponse(res, rej))
        })
    }

    onGameStateChange(_: (data: Pick<ServerGameState, 'logs' | 'teams' | 'guilds'>) => void): void {
        
    }

    onPause(_: (data: { initiatorId: string } & { paused: boolean; periodStart: number; currentDuration: number }) => void): void {
        
    }



    setGameState = async (payload: GameStatePayload): Promise<void> => {
        await this.api.post('/game-state', payload)
    }

    getGameState = async () => {
        const data = await this.api.get<RedisState['gameState']>('/game-state')

        if (data) {
            return data
        }

        throw new Error()
    }

    private transformServerRedisStateToFinal = (data: RedisState): ServerFinalState => {
        const isInGameStage = [InGameCode.process, InGameCode.draft].includes(data.stage as InGameCode)

        return {
            ...data.generalState,
            stage: isInGameStage ? StageCode.game : data.stage as StageCode,
            roomState: data.roomState,
            teams: data.gameState.teams,
            game: {
                ...data.gameState,
                ...data.time,
                stage: data.stage as InGameCode,

            }
        }
    }

    getState = async () => {
        const data = await this.api.get<RedisState>('')
      
        if (data) {
            return this.transformServerRedisStateToFinal(data)
        }
        
        throw new Error('PRIVATE')
    }

    private onWebsocketEvent = (key: WebsocketEvents) => {
        this.socket.on(key, (...args: any[]) => {
            this.callAllCallbacks(key, args)
        })
    }

    connect = (userId: string, cb: () => void): Promise<void> => {
        return new Promise((res) => {
            this.socket = io(WEBSOCKET_SERVER_PATH, {
                auth: {
                    token: userId,
                    room: this.roomId
                }
            })
            this.socket.on(WEBSOCKET_EVENTS.connect, cb)
            this.onWebsocketEvent(WEBSOCKET_EVENTS.kick)
            this.onWebsocketEvent(WEBSOCKET_EVENTS.logAction)
            this.onWebsocketEvent(WEBSOCKET_EVENTS.startStage)
            this.onWebsocketEvent(WEBSOCKET_EVENTS.changeReadyStatus)
            this.onWebsocketEvent(WEBSOCKET_EVENTS.editRoomProps)
            this.onWebsocketEvent(WEBSOCKET_EVENTS.leaveTeam)
            this.onWebsocketEvent(WEBSOCKET_EVENTS.joinTeam)
            this.socket.on(WEBSOCKET_EVENTS.startStage, (data: RedisState) => {
                this.callAllCallbacks(WEBSOCKET_EVENTS.startStage, this.transformServerRedisStateToFinal(data))
            })
            res()
        })
       
    }

    joinTeam = (teamId: string): Promise<void> => {
        return new Promise((resolve, rej) => {
            this.setLoading(WEBSOCKET_EVENTS.joinTeam, true)
            this.socket.emit(WEBSOCKET_EVENTS.joinTeam, teamId, (res: WebsocketResponse) => {
                this.setLoading(WEBSOCKET_EVENTS.joinTeam, false)
                this.throwError(res, rej)
                resolve()
            })
        })
       
    }

    changeAdmin = async (email: string, reverse = false): Promise<void> => {
        return new Promise((res, rej) => {
            this.socket.emit(WEBSOCKET_EVENTS.changeAdmins, email, reverse, this.operateResponse(res, rej))
        })
    }

    saveRoom = async (): Promise<void> => {
       await this.api.get('/save')
    }

    undoSaveRoom = async (): Promise<void> => {
        await this.api.delete('/save')
    }

    onChangeAdmins = (cb: (email: string, reverse: boolean) => void): void => {
        this.saveCallback(WEBSOCKET_EVENTS.changeReadyStatus, cb)
    }

    kickUser = (email: string, withBan: boolean): Promise<void> => {
        return new Promise((res, rej) => {
            this.socket.emit(WEBSOCKET_EVENTS.kick, email, withBan, this.operateResponse(res, rej))
        })
    }

    undoBanUser = async (userEmail: string): Promise<void> => {
        try {
            await this.api.delete(`/blacklist/${userEmail}`)
        } catch (e) {
            NotificationService.getInstance().addNotification({ type: NotificationType.system, variant: NotificationVariant.error, message: 'Не удалось заблокировать пользователя' })
            throw e
        }
    }

    private operateResponse = (res: Function, rej: (err: Error) => void) => (response: WebsocketResponse) => {
        this.throwError(response, rej)
        res()
    } 

    leaveTeam = (): Promise<void> => {
        return new Promise((res, rej) => {
            this.socket.emit(WEBSOCKET_EVENTS.leaveTeam, this.operateResponse(res, rej))
        })
    }

    setReadyStatus(value: boolean): Promise<void> {
        return new Promise((res, rej) => {
            this.socket.emit(WEBSOCKET_EVENTS.changeReadyStatus, value, this.operateResponse(res, rej))
        })
    }

    startStage = (stage: InGameCode, data: GameStatePayload): Promise<void> => {
        return new Promise((res, rej) => {
            this.socket.emit(WEBSOCKET_EVENTS.startStage, stage, data, this.operateResponse(res, rej))
        })
       
    }

    onStartStage = (cb: (data: ServerFinalState) => void): void => {
        this.saveCallback(WEBSOCKET_EVENTS.startStage, cb)
    }

    onKickUser(cb: (userId: string) => void): void {
        this.saveCallback(WEBSOCKET_EVENTS.kick, cb)
    }

    onChangeReadyStatus = (cb: (userId: string, status: boolean) => void): void => {
        this.saveCallback(WEBSOCKET_EVENTS.changeReadyStatus, cb)
    }

    onEditProps = (cb: (data: Partial<ServerRoomPropsPayload>) => void): void => {
        this.saveCallback(WEBSOCKET_EVENTS.editRoomProps, cb)
    }

    onJoinTeam = (cb: (user: ServerUser, teamId: string) => void): void => {
        this.saveCallback(WEBSOCKET_EVENTS.joinTeam, cb)
    }

    onLeaveTeam(cb: (userId: string) => void): void {
        this.saveCallback(WEBSOCKET_EVENTS.leaveTeam, cb)
    }

    disconnect = (cb: () => void): Promise<void> => {
        return new Promise((res) => {
            this.socket.on(WEBSOCKET_EVENTS.disconnect, () => {
                cb()
                res()
            })
            this.socket.disconnect()
        })
    }

    sendLog = (log: Log): void => {
        this.socket.emit(WEBSOCKET_EVENTS.logAction, log, this.operateError)
    }

    getLog = (cb: (log: Log) => void): void => {
        this.saveCallback(WEBSOCKET_EVENTS.logAction, cb)
    }

    editProps = async (payload: Partial<ServerRoomPropsPayload>): Promise<void> => {
        this.socket.emit(WEBSOCKET_EVENTS.editRoomProps, payload, this.operateError)
    }
}


// export class LocalGameApi extends GameAPI {
//     getGameState = async () => {
//         const state = this.getLSState()
//         return {
//             teams: state.teams,
//             logs: state.game.logs,
//             guilds: state.game.guilds
//         }
//     }

//     pause(payload: { initiatorId: string } & { paused: boolean; periodStart: number; currentDuration: number }): void {
        
//     }

//     onPause(cb: (data: { initiatorId: string } & { paused: boolean; periodStart: number; currentDuration: number }) => void): void {
        
//     }

//     onGameStateChange(cb: (data: Pick<ServerGameState, 'logs' | 'teams' | 'guilds'>) => void): void {
        
//     }

//     private lsKey = `riftforce_currentgame_${this.roomId}`

//     private getLSState = (): ServerFinalState => {
//         const data = localStorage.getItem(this.lsKey)
//         return data ? JSON.parse(data) as ServerFinalState : EMPTY_SERVER_FINAL_STATE
//     }

//     private setLSState = (state: ServerFinalState) => {
//         localStorage.setItem(this.lsKey, JSON.stringify(state))
//     }

//     setState = async (state: Partial<ServerFinalState>): Promise<void> => {
//         this.setLSState({ ...this.getLSState(), ...state })
//     }
//     getState = async (): Promise<ServerFinalState> => {
//         return this.getLSState()
//     }
//     getRoomState = async (): Promise<ServerRoomState> => {
//         const state = this.getLSState()
//         return {
//             ...state.roomState,
//             teams: state.teams
//         }
//     }
//     setRoomState = async ({ teams, ...state }: ServerRoomState): Promise<void> => {
//         const prevState = this.getLSState()
//         this.setLSState({
//              ...prevState,
//              roomState: state,
//              teams: prevState.teams.map((team, i) => ({
//                 ...team,
//                 users: team.users.map((user, j) => ({
//                     ...user,
//                     ...teams[i].users[j]
//                 }))
//              }))
//         })
//     }
  
//     setGameState = async ({ teams, ...state }: GameStatePayload): Promise<void> => {
//         const prevState = this.getLSState()
//         this.setLSState({
//              ...prevState,
//              game: {
//                 ...prevState.game,
//                 ...state
//              },
//              teams: prevState.teams.map((team, i) => ({
//                 ...team,
//                 users: team.users.map((user, j) => ({
//                     ...user,
//                     ...teams[i].users[j]
//                 }))
//              }))
//         })
//     }
//     connect(){}
//     startStage(){}
//     getStartedStage(){}
//     disconnect(){}
//     sendLog(){}
//     getLog(){}

//     editProps = async ({ password, type, ...props }: Partial<ServerRoomPropsPayload>): Promise<void> => {
//         const prevState = this.getLSState()
//         this.setLSState({
//             ...prevState,
//             roomState: {
//                 ...prevState.roomState,
//                 password: password || prevState.roomState.password,
//                 type: type || prevState.roomState.type,
//                 props: {
//                     ...prevState.roomState.props,
//                     ...props
//                 }
//             }
//         })
//     }
// }

export class GameState implements IStageController {
    currentStage: Stage | null  = null
    initialized: boolean = false
    api: IGameAPI
    // chat: Chat
    loading: boolean = false
    currentUser: User
    defaultState: ServerFinalState | undefined
    type: GameType

    constructor (sessionId: string, type: GameType, currentUser?: User | null) {
        this.type = type
        this.api = new WebSocketGameAPI(sessionId)
        // this.chat = new Chat(api)
        this.currentUser = currentUser || new User('guest', 'Гость', 'none', null)
        makeAutoObservable(this)
    }

    setApi = (api: IGameAPI) => {
        this.api = api
        // this.chat.setApi(api)
    }

    stopLoading(): void {
        this.loading = false
    }

    getState = async () => {
        
    }

    setGameStage = (stage: Stage, preloading?: boolean) => {
        this.currentStage = stage
        this.currentStage.start()
        this.loading = !!preloading
    }

    initialize = () => {
        this.initialized = true
    }

    getStage(): Stage<object, unknown, object> {
        return this.currentStage!
    }

    setStage(stage: Stage<object, unknown, object>): void {
        this.currentStage = stage
    }

    private applyDefault = (data: ServerFinalState) => {
        const { bigDaddy, teams, roomState, owner, game, stage } = data
 
            const isBigDaddy = this.currentUser?.id === bigDaddy
            const gameStage = new InGameStageController(this, isBigDaddy)
            const ownerData = teams.map(t => t.users).flat().find(u => u.id === owner)!
            const roomOwner = UserMapper.toDomain(ownerData)
    
            const roomDefault: GameRoomDefaultData = {
                owner: roomOwner,
                saved: roomState.saved,
                props: GameRoomPropsMapper.toDomain(roomState),
                teams: teams.map(RoomTeamMapper.toDomain),
                blackList: roomState.blackList,
                admins: roomState.administrators,
            }

            roomDefault.teams.forEach(team => {
                team.users.forEach(({ email, setType }) => {
                    if (roomState.administrators.includes(email)) {
                        setType(UserType.moderator)
                    }
                })
            })

            const gameDefaultData: InGameStageControllerDefaultData = {
                ...game,
                teams,
                currentUser: this.currentUser
            }

            switch (stage) {
                case StageCode.room:
                    const gameRoom = new GameRoom(this, roomOwner, this.api, this.currentUser, isBigDaddy, roomDefault)
                    gameRoom.setNext(gameStage)
                    this.setStage(gameRoom)
                    break
                case StageCode.game:
                    gameStage.setDefaultData(gameDefaultData)
                    this.setStage(gameStage)
                    break
            }   
            this.getStage().start()
    }

    start = async (data?: PrevState, onDeniAccess?: Function) => {
        if (data && this.type === GameType.local) {
            const gameStage = new InGameStageController(this, true)
            this.setStage(gameStage)
            gameStage.start(data)
        } else {
            try {
                const state = await this.api?.getState() 
                this.applyDefault(state)

                this.api.onStartStage((data) => {
                    this.applyDefault(data)
                })
            
                if (this.currentUser) {
                    this.api?.connect(this.currentUser.id, () => {})
                }
            } catch (e: any) {
                if (e.message === 'PRIVATE') {
                    onDeniAccess && onDeniAccess()
                }
            }
        }
    }
    
    stop() {
        this.api
    }
}

interface IService {
    stop(): void
}
interface IServiceWithCurrentUser extends IService {
    currentUser: User | null
}


export class ServiceWrapper<T extends IService> {
    service: T | null = null

    setService = (service: T) => {
        this.service = service
    }

    clearService = () => {
        this.service?.stop()
        this.service = null
    }
}

export class WithCurrentUserServiceWrapper<T extends IServiceWithCurrentUser> {
    service: T | null = null
    authService: AuthUserController 

    constructor(authService: AuthUserController) {
        this.authService = authService
        makeObservable(this, {
            service: observable,
            setService: action,
            clearService: action
        })
    }

    setService = (cb:( (currentUser: User) =>  T)): Promise<T> => {
        return new Promise((res, rej) => {
            if (this.authService.user) {
                this.service = cb(this.authService.user)
                res(this.service as T)
            }

            rej()
        })
    }

    clearService = () => {
        this.service?.stop()
        this.service = null
    }
}

export class BaseInGameControllerDecorator  implements IInGameStageController {
    private controller: IInGameStageController
    
    constructor(controller: IInGameStageController) {
        this.controller = controller
    }

    processAddingLog = (log: Log): void => {
        this.controller.processAddingLog(log)
    }

    processLoggingAction = (log: Log): void => {
        this.controller.processLoggingAction(log)
    }

    getEntityState = () => {
        return this.controller.getEntityState()
    }

    setStage = (stage: InGameStage<unknown, unknown>): void => {
        this.controller.setStage(stage)
    }

    getLogger = (): Logger => {
        return this.controller.getLogger()
    }

    getTurnController = (): Turn  => {
        return this.controller.getTurnController()
    }

    getTimer = (): Timer => {
        return this.controller.getTimer()
    }

    getPauseStatus = (): boolean => {
        return this.controller.getPauseStatus()
    }

    processUserTurn = (user: User) => {
        this.controller.processUserTurn(user)
    }

    start = (): void  =>{
        this.controller.start()
    }

    stop = () => {
        this.controller.stop()
    }

    enableBots = (status: boolean): void => {
        this.controller.enableBots(status)
    }

    setTimer(timer: Timer): void {
        this.controller.setTimer(timer)
    }

    setLogger(logger: Logger): void {
        this.controller.setLogger(logger)
    }

    getStage =() => {
        return this.controller.getStage()
    }

    pause = () => {
        this.controller.pause()
    }

    unpause = (): void => {
        this.controller.unpause()
    }
}


export class SyncronizedInGameStageControllerDecorator extends BaseInGameControllerDecorator {
    private updater: InGameStageUpdater<any>
    private api: ISyncGameAPI

    constructor(controller: IInGameStageController, api: ISyncGameAPI) {
        super(controller)
        const stage = controller.getStage()
        this.api = api
        this.updater = new DraftUpdater(stage as Draft)
        this.api.onGameStateChange(state => {
            this.updater.updateAllState(state)
        })
    }

    private setUpdater = (stage: InGameStage) => {
        switch(stage.code) {
            case InGameCode.draft:
                this.updater = new DraftUpdater(stage as Draft)
                break
            case InGameCode.process:
                this.updater = new GameProcessUpdater(stage as GameProcess)
                break
            default:
                this.updater = new DraftUpdater(stage as Draft)
        }
    }

    pause = () => {
        super.pause()
    }

    unpause = (): void => {
        super.unpause()
    }

    setStage = (stage: InGameStage) => {
        super.setStage(stage)
        this.setUpdater(stage)
    }

    processLoggingAction = (log: Log) => {
        super.processLoggingAction(log)

        const logActionsForSync: string[] = [LOG_ACTIONS.switch_turn, LOG_ACTIONS.start_action_iteration]

        if (logActionsForSync.includes(log.action)) {
            this.api.setGameState(this.getEntityState())
        } 
    }
}


export class LogSyncrnoziedInGameStageControllerDecorator extends BaseInGameControllerDecorator {
    logReader: LogReader
    access: User | null = null
    api: ILoggingGameAPI
    
    constructor(controller: IInGameStageController, api: ILoggingGameAPI) {
        super(controller)
        const stage = controller.getStage()
        this.logReader =  new DraftLogReader(stage as Draft)
        this.api = api
        this.setLogReader(stage)
        this.api.getLog(this.applyServerLog)
        this.setAccess(this.getTurnController().currentTurn)
    }

    private applyServerLog = (log: Log) => {
        this.getLogger().addLog(log)
        this.processLog(log)
    }

    private setLogReader = (stage: InGameStage) => {
        switch(stage.code) {
            case InGameCode.draft:
                this.logReader = new DraftLogReader(stage as Draft)
                break
            case InGameCode.process:
                this.logReader = new GameProcessLogReader(stage as GameProcess)
                break
            default:
                this.logReader = new DraftLogReader(stage as Draft)
        }
    }

    setAccess = (access: User | null) => {
        this.access = access
    }

    processLog = (log: Log) => {
        const canProcess = this.access
            ? log.instigator.type === LogInstigatorType.user
                ? log.instigator.target === this.access.id
                : true
            : true

        if (canProcess) {
            this.logReader.readLog(log)
        }     
    }

    processLoggingAction = (log: Log) => {
        super.processLoggingAction(log)

        if (log.action === LOG_ACTIONS.switch_turn) {
            this.setAccess(this.getTurnController().currentTurn)
        }

        this.api.sendLog(log)
    }
}



export class InGameStageController extends Stage<PrevState, InGameStageControllerDefaultData> implements IInGameStageController {
    stage: InGameStage | null = null
    private logger: Logger = new Logger()
    private timer: Timer = new Timer()
    private turn: Turn = new Turn([])
    private paused: boolean = false
    private initialized: boolean = false

    constructor(controller: IStageController, isBigDaddy: boolean, defaultData?: InGameStageControllerDefaultData) {
        super(StageCode.game, controller, isBigDaddy, defaultData)
        this.setLogger(this.logger)
        makeObservable(this, {
            'stage': observable,
            'setStage': action
        })
    }

    getEntityState = (): GameStatePayload => {
        const controller = this
        const guilds = controller.getStage().code === InGameCode.draft ? GuildsPoolMapper.toEntity((controller.getStage() as Draft).guilds) : []

        const feilds = controller.getStage().code === InGameCode.process
            ?  FieldsControllerMapper.toEntity((controller.getStage() as GameProcess).gameField)
            : new Map()
        
        const emptyDeck: ServerUserDecks = {
            left: [],
            hand: [],
            deck: []
        }

        const emptyDraft: ServerUserPicks = {
            picks: [],
            bans: []
        }

        return {
            teams: controller.getTurnController().teams.map(team => ({
                id: team.id,
                points: controller.getStage().code === InGameCode.process
                    ? (controller.getStage() as GameProcess).points.points.get(team)!
                    : 0,
                name: team.name || '',
                users: team.users.map(user => ({
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar,
                    rating: user.rating,
                    fields: controller.getStage().code === InGameCode.process
                        ? feilds.get(user)!
                        : [],
                    draft: controller.getStage().code === InGameCode.draft
                        ? UserDraftMapper.toEntity((controller.getStage() as Draft).usersDraft.get(user)!)
                        : emptyDraft,
                    cards: controller.getStage().code === InGameCode.process
                        ? CardsControllerMapper.toEntity((controller.getStage() as GameProcess).usersCards.get(user)!)
                        : emptyDeck,
                }))
            })),
            guilds
        }
    }

    getTimer = (): Timer => {
        return this.timer
    }

    getLogger = () => {
        return this.logger
    }

    getTurnController = () => {
        return this.turn
    }

    getStage = () => {
        return this.stage!
    }

    getPauseStatus = () => {
        return this.paused
    }

    setStage = (stage: InGameStage) => {
        this.stage = stage
    }

    setTimer = (timer: Timer) => {
        if (!this.initialized) {
            this.timer = timer
        }
    }

    processUserTurn = (user: User): void => {
        if (user.type === UserType.bot && user instanceof Bot) {
            user.move()
        }
    }

    processAddingLog = (_: Log) => {}
    processLoggingAction = (_: Log) => {}

    private configureAllBots = () => {
        if (this.turn) {
            this.turn.usersOrder.forEach(([user]) => {
                if (user.type === UserType.bot && user instanceof Bot) {
                    user.setStageController(this)
                }
            })
        }
    }

    private createGameProcessInstance = (def?: DefaultProcessGameState) => {
        return new GameProcess(this.turn, this, this.isBigDaddy, this.logAction, def)
    }

    private createDraftInstance = (def?: DefaultPicks) => {
       return new Draft(this.turn, this, this.isBigDaddy, this.logAction, def)
    }

    start = (prev?: PrevState) => {
        this.initialized = true
        this.getStage()?.setLogAction(this.logAction)

        if (this.defaultData) { 
            const gameProcessDefaultData: DefaultProcessGameState = {
                points: new Map(),
                fields: new Map(),
                cards: new Map()
            }

            const draftDefaultData: DefaultPicks = {
                total: this.defaultData.guilds,
                users: new Map()
            }

            const teams = this.defaultData.teams.map(( { id, name, users, points } ) => {
                const team = new Team(id, users.map(({ fields, cards, draft, ...data }) => {
                    const user = UserMapper.toDomain(data)

                    gameProcessDefaultData.fields.set(user, fields)
                    gameProcessDefaultData.cards.set(user, cards)
                    draftDefaultData.users.set(user, draft)

                    return user
                }) , name)
                gameProcessDefaultData.points.set(team, points)

                return team
            })

            this.turn = new Turn(teams , this.defaultData.currentUser)
            this.turn.setNextTurnSideEffect(this.processUserTurn)

            this.configureAllBots()
            this.logger.setLogs(this.defaultData.logs)

            const gameProcess = this.createGameProcessInstance(gameProcessDefaultData)

            this.timer.setOffset(this.defaultData.currentDuration)
            this.timer.setOffsetAccordingStartDate(this.defaultData.periodStart)

            if (this.defaultData.stage === InGameCode.draft) {
                const draft = this.createDraftInstance(draftDefaultData)
                draft.setNext(gameProcess)
                this.setStage(draft)
            } else {
                this.setStage(gameProcess)
            }

            this.getStage().start()

            if (this.defaultData.paused) {
                this.pause()
            }
        } else if (prev) {
            this.turn = new Turn(prev.users.teams, prev.users.currentUser)
            this.turn.setNextTurnSideEffect(this.processUserTurn)
            this.configureAllBots()
            const draft = this.createDraftInstance()
            draft.setNext(this.createGameProcessInstance())
            this.setStage(draft)
            this.getStage().start(prev.config)
        }
    }

    pause = () => {
        this.paused = true
        this.timer.pause()
        this.getStage().setEnabled(false)
    }

    unpause = () => {
        this.paused = false
        this.timer.start()
        this.getStage().setEnabled(true)
    }

    setLogger = (logger: Logger) => {
        if (!this.initialized) {
            this.logger = logger
            this.logger.setAddLogSideEffect(this.processLoggingAction)
            this.logger.setTimer(this.timer)  
        }
    }

    logAction = (log: LogPayload): void => {
        return this.logger.logAction({...log, instigator: log.instigator || {
            type: LogInstigatorType.user,
            target: this.turn.currentTurn.id
        } as LogInstigator }, this.processLoggingAction)
    }

    enableBots = (status: boolean) => {
        this.turn.usersOrder.forEach(([user]) => {
            if (user.type === UserType.bot && user instanceof Bot) {
                user.setEnabled(status)
            }
        })
    }
}



class DraftLogReader implements LogReader  {
    stage: DraftFacade

    constructor (stage: Draft) {
        this.stage = new DraftFacade(stage)
    }

    readLog({ action, target }: Log): void {
        if (action === LOG_ACTIONS.select_guild) {
            this.stage.selectGuildByCode(target! as GuildCode)
        }
    }
}

class GameProcessLogReader implements LogReader {
    stage: GameProcessFacade

    constructor(stage: GameProcess) {
        this.stage = new GameProcessFacade(stage)
    }

    readLog({ action, target }: Log): void {
        switch(action) {
            case LOG_ACTIONS.select_card:
                this.stage.selectCardByCode(target!)
                break;
            case LOG_ACTIONS.select_field:
                this.stage.selectFieldByCode(target!)
                break;
            case LOG_ACTIONS.stop_turn:
                this.stage.stopTurn()
                break;
            default:
                const [operation,, type] = action.split('_')
                const spawnOperation = LOG_ACTIONS.spawnBy('guild').split('_')[0]
                const activateOperation = LOG_ACTIONS.activateBy('guild').split('_')[0]

                if (operation === spawnOperation) {
                    this.stage.spawnCardByCode(target!, type as InteractionType)
                } else if (operation === activateOperation) {
                    this.stage.activateCardByCode(target!, type as InteractionType)
                }
        }
    }
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



abstract class Facade {
    protected selectElement = (el: SelectiveElement | null | undefined) => {
        if (el) {
            el.select()
        }
    }
}

export class GameProcessFacade extends Facade {
    process: GameProcess 

    constructor(process: GameProcess) {
        super()
        this.process = process
    }

    draw = () => {
        this.process.currentDeck().makeDraw()
    }

    getSequentialActionIterationIndex = () => {
        const action = this.process.action.strategy as SequentialStrategy

        if (action && action instanceof SequentialStrategy) {
           return action.index
        }
        
        return null
    }

    private interactWithCard = (card: Card | null | undefined, method: 'activate' | 'summon' , type: InteractionType) => {
        if (card) {
            card[method]()
            this.choseGuildOrValue(type)
        }
    }

    selectRandomCard = () => {
        getRandomElement(this.getCurrentTurnAvailableCards()).select()
    }

    selectRandomField = () => {
        getRandomElement(this.getAvailableFields()).select()
    }

    activateCardByIndex = (index: number, type: InteractionType) => {
        const card = this.getCurrentTurnAvailableCards()[index]
        this.interactWithCard(card, 'activate', type)
        return card?.mobData.code
    }

    activateCardByCode = (code: string, type: InteractionType) => {
        this.interactWithCard(this.getCurrentTurnAvailableCards().find(card => card.mobData.code === code), 'activate', type)
    }

    selectEmptyField = (row: number) => {
        const fields = [] as Field[]
        this.process.gameField.iterateThroughUserNodes(node => {
            fields.push(node.fields.at(-1)!)
        }, this.process.turn.currentTurn)

        fields[row].select()
    }

    spawnCard = (index: number, type: InteractionType) => {
        this.interactWithCard(this.getCurrentTurnAvailableCards()[index], 'summon', type)
    }

    spawnCardByCode = (code: string, type: InteractionType) => {
        this.interactWithCard(this.getCurrentTurnAvailableCards().find(card => card.mobData.code === code), 'summon', type)
    }

    private interactWithSequentialAction = (cb: ((action: SequentialStrategy) => void)) => {
        const action = this.process.action.strategy as SequentialStrategy
        if (action && action instanceof SequentialStrategy) {
           cb(action)
        }
    }

    choseGuildOrValue = (type: InteractionType) => {
        this.interactWithSequentialAction(action => {
            if (type === 'guild') {
                action.chooseGuild()
            } else {
                action.chooseValue()
            }
        })
    }

    selectCardByIndex = (index: number) => {
        const card = this.getCurrentTurnAvailableCards()[index]
        this.selectElement(card)
        return card?.mobData.code
    }

    selectCardByCode = (code: string) => {
        this.selectElement(this.getCurrentTurnAvailableCards().find(card => card.mobData.code === code))
    }

    selectFieldByIndex = (index: number) => {
        const field = this.getAvailableFields()[index]
        this.selectElement(field)
        return field?.code
    }

    selectFieldByCode = (code: string) => {
        this.selectElement(this.getAvailableFields().find(field => field.code === code))
    }

    getCurrentTurnHandCards = () => {
        return this.process.currentDeck().hand.cards as Card[]
    }

    getCurrentTurnAvailableCards = () => {
        return Array.from(this.process.currentDeck().highlighted) as Card[]
    }

    getAvailableFields = () => {
        return  Array.from(this.process.gameField.highlighted) as Field[]
    }

    getCurrentTurnUserFields = () => {
        return this.process.gameField.getUserFieldsInArray(this.process.turn.currentTurn)
    }

    getCurrentTurnTeamFields = () => {
        return this.process.gameField.getTeamFieldsInArray(this.process.turn.currentTurnTeam)
    }

    stopTurn = () => {
        this.interactWithSequentialAction(action => action.stopImmediately())
    }

    getEnemiesForCurrentTurnUserFields = () => {
        return this.process.gameField.getEnemyFieldsForUserInArray(this.process.turn.currentTurn)
    }

    getEnemiesForCurrentTurnTeamFields = () => {
        return this.process.gameField.getEnemyFieldsForTeamInArray(this.process.turn.currentTurnTeam)
    }

    getCountPointsForDraw = () => {
        return this.process.gameField.calculateControllerNodesByUser(this.process.turn.currentTurn)
    }
}

export class DraftFacade extends Facade {
    draft: Draft

    constructor(draft: Draft) {
        super()
        this.draft = draft
    }

    selectGuildByCode = (code: GuildCode) => {
        this.draft.guilds.getConcreteGuildAsync(code)
    }

    selectGuildByIndex = (index: number) => {
        const el = Array.from(this.draft.guilds.guilds)[index]
        this.selectElement(el)
        return el?.guild.code
    }

    takeRandomGuild = () => {
        this.draft.guilds.takeRandomGuildAsync()
    }
}

abstract class PlayerAPI {
    protected session: string

    constructor (session: string) {
        this.session = session
    }

    abstract getGameSessionStartState(): Promise<Pick<PlayedGame, 'startState' | 'teams'>>
}

class RemotePlayerAPI extends PlayerAPI {
    getGameSessionStartState = async () => {
        return privateApi.get<Pick<PlayedGame, 'startState' | 'teams'>>('./').then(data => data.data)
    }
}

class LocalPlayerAPI extends PlayerAPI {
    getGameSessionStartState(): Promise<Pick<PlayedGame, 'teams' | 'startState'>> {
        return new Promise((res, rej) => {
            const lsData = localStorage.getItem(LS_PLAYED_GAMES_KEY)
            const games: PlayedGame[] = lsData ? JSON.parse(lsData) : []
            const found = games.find(({ id }) => id === this.session)

            if (!found) {
                rej('not such game')
            } else {
                res(found)
            }
        }) 
    }
}

export class GamePlayer implements IStageController {
    startState: InGameStageControllerDefaultData| undefined
    keyframes: (Pick<ServerGameState, 'teams' | 'guilds'>)[] = []
    stageController: IInGameStageController | undefined
    keyframesInitialized: boolean = false
    timer: Timer = new Timer()
    currentLogIndex: number = -1
    api: PlayerAPI
    private applyState: ((state: ServerGameState) => void) | undefined

    constructor(session: string, type: GameType) {
        this.api = type === GameType.local ? new LocalPlayerAPI(session) : new RemotePlayerAPI(session)
    }

    start = async () => {
        try {
            const data = await this.api.getGameSessionStartState()
            const { logs, guilds, users } = data.startState

            this.startState = {
                currentDuration: 0,
                stage: InGameCode.draft,
                paused: false,
                periodStart: 0,
                logs,
                currentUser: null,
                guilds: guilds as GuildCode[],
                teams: data.teams.map(team => ({
                    ...team,
                    points: 0,
                    users: team.users.map(user => users.find(u => u.id === user)!)
                }))
            }

            let processLogCb: (log: Log) => void
                const loggingAPI: ILoggingGameAPI = {
                    getLog(cb) {
                        processLogCb = cb
                    },
                    sendLog() {}
                }       

                this.stageController = new LogSyncrnoziedInGameStageControllerDecorator(
                    new InGameStageController(this, true, this.startState),
                    loggingAPI
                )

                this.stageController.enableBots(false)
                this.stageController.start()

                this.startState.logs.filter(({ type }) => type === 'util').forEach(log => {
                    processLogCb && processLogCb(log)
                    this.keyframes.push(this.stageController!.getEntityState())
                })
        } catch (_) {

        }
    }

    printKeyframe = (index: number) => {
        if (this.startState && this.stageController && index >= 0 && index < this.startState.logs.length) {
            this.applyState && this.applyState(this.keyframes[index] as ServerGameState)
        }
    }

    stop(): void {
        if (this.startState) {
            const syncronizingApi: ISyncGameAPI = {
                onGameStateChange: (cb) =>{
                    this.applyState = cb
                },
                pause: async () => {},
                onPause: () => {},
                setGameState: async () => {},
            }

            this.stageController = new SyncronizedInGameStageControllerDecorator(
                new InGameStageController(this, true,
                    { ...this.startState, currentUser: null }),
                syncronizingApi
            )

           this.stageController.setTimer(this.timer)

           this.timer.setSideEffect((time) => {
               const observableLog = this.startState?.logs[this.currentLogIndex + 1]
   
               if (observableLog && observableLog.timestamp && observableLog.timestamp.seconds <= time) {
                   this.currentLogIndex += 1
               }
           })

           this.stageController.start()
           this.keyframesInitialized = true
        }
    }

    setConcreteTime = (seconds: number) => {
        this.timer.setOffset(seconds)
        let index = 0

        this.startState?.logs.forEach((log, i) => {
            if (log.timestamp && log.timestamp.seconds <= seconds) {
                index = i
            }
        })

        this.currentLogIndex = index
    } 

    pause = () => {
        if (this.keyframesInitialized) {
            this.timer.pause()
        }
    }

    play = () => {
        if (this.keyframesInitialized) {
            this.timer.start()
        }
    }

    getStage(): Stage<object, unknown, object> {
        return this.stageController!.getStage()
    }

    setStage(_: Stage<object, unknown, object>): void {
        
    }
}

export { DraftStage }
