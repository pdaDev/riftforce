import {
    AirGuild,
    Card,
    CardsController,
    Chat,
    FieldsController,
    GameContentBuilder,
    GameProcess,
    Draft,
    DraftContentBuilder,
    Elemental,
    Field,
    Guild,
    GuildFactory,
    GuildsPoolController,
    Iterator,
    Killer,
    MapNode,
    ChatMessage,
    MobData,
    MusicGuild,
    PointsManager,
    Team,
    Turn,
    User,
    UserDraft,
    InGameStageController,
    GameProcessFacade,
    LOG_ACTIONS,
    SequentialStrategy,
    Timer,
    DraftStage,
    GameProcessUpdater,
    DraftUpdater,
    Spawn,
    Activation,
    FireGuild,
    DraftFacade,
    Logger,
} from "./src/Classes/Class"
import {
    CardsControllerMapper,
    FieldsControllerMapper,
    GuildsPoolMapper,
} from "./src/Classes/Mapper"
import { BASE_GUILDS_CODE } from "./src/Classes/constants"
import {
    ChatAPI,
    ElementalCode,
    GuildCode,
    IStageController,
    InteractionType,
    LogInstigatorType,
    LogPayload,
    Mediator,
    ServerUserDecks,
    ServerUserPicks,
    UsersCards,
} from "./src/Classes/namespace"

class MediatorStub implements Mediator {
    notify = jest.fn()
}

const stub = new MediatorStub()

const user1 = new User("1", "user1", "", null)
const user2 = new User("2", "user2", "", null)
const user3 = new User("3", "user3", "", null)
const user4 = new User("4", "user4", "", null)

const team1 = new Team("1", [user1])
const team2 = new Team("2", [user2])
const team3 = new Team("1", [user1, user2])
const team4 = new Team("2", [user3, user4])

const teams1 = [team1, team2]
const teams2 = [team1, team4]
const teams3 = [team3, team4]

test("work test", () => {})

describe("Game process work test", () => {
    let process: GameProcess
    let gameState: InGameStageController
    beforeEach(() => {
        const usersDrafts = new Map<User, UserDraft>()
        const draft1 = new UserDraft()
        const draft2 = new UserDraft()

        GuildFactory.getInstance()
            .createSeveral(["ACID", "AIR", "BEAST", "COMET"])
            .forEach((guild) => {
                draft1.choose(guild)
            })
        GuildFactory.getInstance()
            .createSeveral(["FIRE", "WATER", "DARK", "BEAST"])
            .forEach((guild) => {
                draft2.choose(guild)
            })

        usersDrafts.set(user1, draft1)
        usersDrafts.set(user2, draft2)

        const teams = [team1, team2]
        const turn = new Turn(teams)

        gameState = new InGameStageController(new IStageControllerStub(), true)
        process = new GameProcess(turn, gameState, true, undefined)
        process.start(usersDrafts)
    })

    test("start highlight hand", () => {
        process.iterate(() => {})
        expect(process.turn.isMyTurn).toBe(true)
        expect(process.currentDeck().enabled).toBe(true)
        process.stop()
    })

    test("stop process work", () => {
        process.start()
        expect(process.isEnd()).toBe(false)
        const spy = jest.spyOn(gameState, "stop")
        process.stop()
        expect(spy).toBeCalled()
    })

    describe("Actions test", () => {
        beforeEach(() => {
            const turn = new Turn(teams1, user1, user1)
            const teamPoints = new Map<Team, number>()
            teamPoints.set(team1, 0)
            teamPoints.set(team2, 0)

            const userFields = new Map<User, ElementalCode[][]>()
            userFields.set(user1, [
                [],
                ["AIR_7_0_5"],
                ["AIR_5_0_5"],
                ["AIR_5_0_5"],
                ["LAVA_7_0_5"],
            ])
            userFields.set(user2, [[], ["FIRE_7_0_5"], [], [], []])

            const userDecks = new Map<User, ServerUserDecks>()
            userDecks.set(user1, {
                left: [],
                hand: ["AIR_7_5", "LIGHT_7_5", "WATER_5_5", "AIR_5_5"],
                deck: [
                    "AIR_5_5",
                    "AIR_5_5",
                    "AIR_5_5",
                    "AIR_5_5",
                    "AIR_5_5",
                    "AIR_5_5",
                    "AIR_5_5",
                    "AIR_5_5",
                    "AIR_5_5",
                ],
            })
            userDecks.set(user2, { left: [], hand: [], deck: [] })

            const gameState = new InGameStageController(
                new IStageControllerStub(),
                true
            )
            process = new GameProcess(turn, gameState, true, undefined, {
                points: teamPoints,
                fields: userFields,
                cards: userDecks,
            })
            process.start()
        })

        test("Activation work test", () => {
            process.currentDeck().hand.cards[0].activate()
            const strategy = process.action.strategy as Activation
            expect(strategy).toBeInstanceOf(Activation)
            strategy.chooseGuild()
            process.gameField.startNode.next?.next?.fields[0].select()
            process.gameField.startNode.next?.lastField?.select()
            expect(strategy.index).toBe(1)
            strategy.stopImmediately()
            expect(process.turn.currentTurn).toBe(user2)
        })

        test("Spawn work test", () => {
            process.currentDeck().hand.cards[0].summon()
            const strategy = process.action.strategy as Spawn
            expect(strategy).toBeInstanceOf(Spawn)
            strategy.chooseValue()
            process.gameField.startNode.next?.lastField?.select()
            expect(strategy.index).toBe(1)
            process.currentDeck().hand.cards[0].select()
            process.gameField.startNode.next?.lastField?.select()
            expect(process.turn.currentTurn).toBe(user2)
        })

        test("Draw work test", () => {
            process.currentDeck().makeDraw()
            expect(process.points.points.get(team1)).toBe(3)
            expect(process.turn.currentTurn).toBe(user2)
            expect(process.getCertainUserDeck(user1).hand.size).toBe(7)
        })
    })
})

describe("Logger work test", () => {
    let logger: Logger
    let turn: Turn
    const teams = [team1, team2]
    const sideEffect = jest.fn()

    beforeEach(() => {
        turn = new Turn(teams, user1, user1)
        logger = new Logger()
        logger.addAddLogSideEffect("side", sideEffect)
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    const expectLog = (expected: LogPayload, index: number = -1) => {
        expect(logger.logs.length).toBeGreaterThan(0)
        const received = logger.logs.at(index)!
        expect(received.action).toBe(expected.action)
        expect(received.instigator).toEqual(
            expected.instigator || { type: "system", target: null }
        )
        expect(received.type).toBe(expected.type || "util")
        expect(received.target).toBe(expected.target || null)
    }

    const expectLogWithTurnUser = (
        expected: Omit<LogPayload, "instigator">,
        index?: number
    ) => {
        expectLog(
            {
                ...expected,
                instigator: {
                    type: LogInstigatorType.user,
                    target: user1.id,
                },
            },
            index
        )
    }

    test("logging side effect test", () => {
        logger.logAction({ action: "ACTION" })
        expect(sideEffect).toBeCalled()
    })

    test("logging timestamp test", () => {
        logger.logAction({ action: "ACTION" })
        expect(logger.logs.at(-1)!.timestamp).toBeUndefined()
        const timer = new Timer()
        logger.setTimer(timer)
        logger.logAction({ action: "ACTION" })
        let timestamp = logger.logs.at(-1)!.timestamp
        expect(timestamp).toBeDefined()
        expect(timestamp?.seconds).toBe(0)
    })

    describe("Game process logging test", () => {
        let state: GameProcessFacade
        let process: GameProcess

        beforeEach(() => {
            const teamPoints = new Map<Team, number>()
            teamPoints.set(team1, 0)
            teamPoints.set(team2, 0)

            const userFields = new Map<User, ElementalCode[][]>()
            userFields.set(user1, [
                [],
                ["AIR_7_0_5"],
                ["AIR_5_0_5"],
                ["AIR_5_0_5"],
                ["LAVA_7_0_5"],
            ])
            userFields.set(user2, [[], ["FIRE_7_0_5"], [], [], []])

            const userDecks = new Map<User, ServerUserDecks>()
            userDecks.set(user1, {
                left: [],
                hand: ["AIR_7_5", "LIGHT_7_5", "WATER_5_5", "AIR_5_5"],
                deck: [
                    "AIR_5_5",
                    "AIR_5_5",
                    "AIR_5_5",
                    "AIR_5_5",
                    "AIR_5_5",
                    "AIR_5_5",
                    "AIR_5_5",
                    "AIR_5_5",
                    "AIR_5_5",
                ],
            })
            userDecks.set(user2, { left: [], hand: [], deck: [] })

            const gameState = new InGameStageController(
                new IStageControllerStub(),
                true
            )
            process = new GameProcess(turn, gameState, true, logger.logAction, {
                points: teamPoints,
                fields: userFields,
                cards: userDecks,
            })
            process.start()
            state = new GameProcessFacade(process)
        })

        test("Field interactions logging", () => {
            state.spawnCardByCode("AIR_7_5", InteractionType.guild)
            state.selectEmptyField(0)
            expectLogWithTurnUser(
                { action: LOG_ACTIONS.select_field, target: "1_0" },
                -3
            )
        })

        test("Cards controller logging test", () => {
            let card = process.currentDeck().hand.cards[0]
            card.activate()
            expectLogWithTurnUser({
                action: LOG_ACTIONS.activate,
                type: "extra",
                target: card.mobData.code,
            })
            ;(process.action.strategy as SequentialStrategy).decline()
            card = process.currentDeck().hand.cards[0]
            card.summon()
            expectLogWithTurnUser({
                action: LOG_ACTIONS.summon,
                type: "extra",
                target: card.mobData.code,
            })
        })

        test("Killer  logging test test", () => {
            const killer =
                process.gameField.getConcreteFieldSync("1_3_AIR_5_0_5")
            const victim =
                process.gameField.getConcreteFieldSync("1_1_AIR_7_0_5")

            process.killer.hit(killer, victim, 3)
            expectLog({
                action: LOG_ACTIONS.hit(3),
                instigator: {
                    target: killer!.code,
                    type: LogInstigatorType.field,
                },
                target: victim!.code,
            })
            process.killer.hit(killer, victim, 3)
            expectLog({
                action: LOG_ACTIONS.die,
                instigator: {
                    type: LogInstigatorType.field,
                    target: victim!.code,
                },
            })
        })

        describe("Actions logging test", () => {
            describe("Activation logging test", () => {
                const card = "AIR_7_5"
                const expectActivateBy = (type: InteractionType) => {
                    state.activateCardByCode(card, type)
                    expectLogWithTurnUser(
                        {
                            action: LOG_ACTIONS.activate,
                            target: card,
                            type: "extra",
                        },
                        0
                    )
                    expectLogWithTurnUser(
                        { action: LOG_ACTIONS.activateBy(type), target: card },
                        1
                    )
                }

                test("card activation logging test", () => {
                    state.activateCardByCode(card, InteractionType.value)
                    state.selectFieldByCode("1_4_LAVA_7_0_5")
                    expectLogWithTurnUser({
                        action: LOG_ACTIONS.activated,
                        target: "1_4_LAVA_7_0_4",
                        type: "extra",
                    })
                })

                test("start by guild work test", () => {
                    expectActivateBy(InteractionType.guild)
                })

                test("start by value work test", () => {
                    expectActivateBy(InteractionType.value)
                })
            })

            describe("Spawn logging test", () => {
                const card = "AIR_7_5"
                const expectSpawnBy = (type: InteractionType) => {
                    state.spawnCardByCode(card, type)
                    expectLogWithTurnUser(
                        {
                            action: LOG_ACTIONS.summon,
                            target: card,
                            type: "extra",
                        },
                        0
                    )
                    expectLogWithTurnUser(
                        { action: LOG_ACTIONS.spawnBy(type), target: card },
                        1
                    )
                }
                test("start by guild work test", () => {
                    expectSpawnBy(InteractionType.guild)
                })

                test("start by value work test", () => {
                    expectSpawnBy(InteractionType.value)
                })

                test("elementals spawn logging test", () => {
                    state.spawnCardByCode(card, InteractionType.guild)
                    state.selectEmptyField(0)
                    expectLogWithTurnUser(
                        {
                            action: LOG_ACTIONS.spawned,
                            target: card,
                            type: "extra",
                        },
                        -2
                    )
                    const secondCard = "AIR_5_5"
                    state.selectCardByCode(secondCard)
                    expectLogWithTurnUser({
                        action: LOG_ACTIONS.select_card,
                        target: secondCard,
                    })
                })
            })

            test("Draw logging test", () => {
                state.draw()
                expectLogWithTurnUser({ action: LOG_ACTIONS.draw })
            })
        })

        test("Stop action logging test", () => {
            state.spawnCardByCode("AIR_7_5", InteractionType.guild)
            state.stopTurn()
            expectLogWithTurnUser({ action: LOG_ACTIONS.stop_turn })
        })
    })

    describe("Draft work test", () => {
        let draft: Draft
        let state: DraftFacade

        beforeEach(() => {
            draft = new Draft(
                new Turn(teams, user1, user1),
                gameStateControllerStub,
                true,
                logger.logAction
            )
            draft.start({
                guildsPerPlayer: 2,
                draftTemplates: [DraftStage.pick, DraftStage.ban],
            })
            state = new DraftFacade(draft)
        })

        test("User picks and bans logging test", () => {
            draft = new Draft(
                new Turn(teams1, user1, user1),
                gameStateControllerStub,
                true,
                logger.logAction
            )
            draft.start({
                guildsPerPlayer: 2,
                draftTemplates: [DraftStage.pick, DraftStage.ban],
            })
            state = new DraftFacade(draft)
            let guild = state.selectGuildByIndex(0)

            expectLog({
                instigator: { type: LogInstigatorType.user, target: user1.id },
                action: LOG_ACTIONS.pick,
                target: guild,
                type: "extra",
            })
            state.selectGuildByIndex(0)
            guild = state.selectGuildByIndex(0)
            expectLog({
                instigator: { type: LogInstigatorType.user, target: user1.id },
                action: LOG_ACTIONS.ban,
                target: guild,
                type: "extra",
            })
        })

        test("Guilds pool logging test", () => {
            const guild = state.selectGuildByIndex(0)
            expectLogWithTurnUser(
                { action: LOG_ACTIONS.select_guild, target: guild },
                0
            )
            expectLogWithTurnUser(
                { action: LOG_ACTIONS.pick, target: guild, type: "extra" },
                1
            )
        })
    })
})

describe("Draft stage test work", () => {
    let draft: Draft

    beforeEach(() => {
        const turn = new Turn(teams1, user1, user1)
        draft = new Draft(turn, gameStateControllerStub, true)
        draft.start({ guildsPerPlayer: 1 })
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    test("turn go to next when user select guild from guild pool", () => {
        expect(draft.isEnd()).toBeFalsy()
        expect(draft.turn.currentTurn).toBe(user1)
        expect(draft.currentStage).toBe(DraftStage.pick)
        draft.processIterate()
        draft.guilds.takeRandomGuildAsync()
        expect(draft.turn.currentTurn).toBe(user2)
        expect(draft.getDraftByUser(user1).chosen.size).toBe(1)
    })

    test("set next stage", () => {
        draft = new Draft(
            new Turn(teams1, user1, user1),
            gameStateControllerStub,
            true
        )
        draft.start({
            guildsPerPlayer: 2,
            draftTemplates: [DraftStage.pick, DraftStage.ban],
        })
        expect(draft.turn.currentTurn).toBe(user1)
        expect(draft.guilds.highlighted.size).toBeGreaterThan(0)
        draft.guilds.takeRandomGuildAsync()
        expect(draft.currentStage).toBe(DraftStage.pick)
        const guildCard = Array.from(draft.guilds.guilds)[0]
        guildCard.select()
        expect(draft.currentStage).toBe(DraftStage.ban)
        draft.guilds.takeRandomGuildAsync()
        expect(draft.currentStage).toBe(DraftStage.ban)
        draft.guilds.takeRandomGuildAsync()
        expect(draft.currentStage).toBe(DraftStage.pick)
    })

    test("random set drafts", () => {
        const draftsCount = 2
        draft = new Draft(
            new Turn(teams1, user1, user1),
            gameStateControllerStub,
            true
        )
        draft.start({ guildsPerPlayer: draftsCount })
        draft.setRandomDrafts()
        expect(draft.isEnd()).toBeTruthy()
        expect(draft.getDraftByUser(user1).chosen.size).toBe(draftsCount)
        expect(draft.getDraftByUser(user2).chosen.size).toBe(draftsCount)
    })
})

describe("Cards controller work test", () => {
    let cards: CardsController
    const decks: ServerUserDecks = {
        hand: [
            "AIR_6_5",
            "AIR_5_5",
            "WATER_6_5",
            "AIR_5_5",
            "GROUND_7_5",
            "AIR_5_5",
            "AIR_5_5",
        ],
        left: [],
        deck: [
            "AIR_5_5",
            "AIR_5_5",
            "AIR_5_5",
            "AIR_5_5",
            "AIR_5_5",
            "AIR_5_5",
            "AIR_5_5",
            "AIR_5_5",
            "AIR_5_5",
            "AIR_5_5",
            "AIR_5_5",
            "AIR_5_5",
            "AIR_5_5",
            "AIR_5_5",
            "AIR_5_5",
            "AIR_5_5",
            "AIR_5_5",
            "AIR_5_5",
            "AIR_5_5",
            "AIR_5_5",
            "AIR_5_5",
            "AIR_5_5",
            "AIR_5_5",
            "AIR_5_5",
            "AIR_5_5",
            "AIR_5_5",
            "AIR_5_5",
            "AIR_5_5",
            "AIR_5_5",
        ],
    }
    beforeEach(() => {
        cards = CardsControllerMapper.toDomain(decks)
        cards.setEnabled(true)
        cards.setClickable(true)
        cards.setHighlightable(true)
    })

    test("highlight cards by some condition without click opportunity", () => {
        cards.highlightCardsSameGuild(
            GuildFactory.getInstance().create("AIR"),
            { clickable: false }
        )
        expect(cards.highlighted.size).toBe(5)
        expect(cards.hand.cards[0].clickable).toBeFalsy()
        expect(cards.hand.cards[0].highlighted).toBeTruthy()
        cards.resetHighlights()
        cards.highlightCardsByValue(5, { clickable: false })
        expect(cards.highlighted.size).toBe(4)
        expect(cards.hand.cards[1].clickable).toBeFalsy()
        expect(cards.hand.cards[1].highlighted).toBeTruthy()
        cards.resetHighlights()
        expect(cards.highlighted.size).toBe(0)
    })

    test("format decks to codes array", () => {
        expect(CardsControllerMapper.toEntity(cards)).toEqual(decks)
    })

    test("highlight all cards for command", () => {
        cards.setEnabled(true)
        cards.highlightHand()
        cards.hand.cards.forEach((card) => {
            expect(card.highlighted).toBeTruthy()
        })
    })

    test("set enabled work test", () => {
        cards.setEnabled(true)
        expect(cards.enabled).toBeTruthy()
        cards.highlight(cards.hand.cards[0])
        expect(cards.highlighted.size).toBe(1)
        cards.resetHighlights()
        cards.setEnabled(false)
        cards.highlight(cards.hand.cards[0])
        expect(cards.highlighted.size).toBe(0)
    })

    test("move cards left", () => {
        cards.moveCardFromHandToLeft(cards.hand.cards[0]!.mobData)
        expect(cards.left.size).toBe(1)
        expect(cards.hand.size).toBe(6)
    })

    test("replenish hand deck", () => {
        cards.moveCardFromHandToLeft(cards.hand.cards[0]!.mobData)
        expect(cards.left.size).toBe(1)
        expect(cards.hand.size).toBe(6)
        cards.replenishHandDeck()
        expect(cards.hand.size).toBe(7)
        expect(cards.total.size).toBe(28)
    })

    test("summon and activate click", () => {
        const card = cards.hand.cards[0]
        const spy = jest.spyOn(cards, "notify")
        card.summon()
        expect(spy).toBeCalledTimes(0)
        cards.getSomeCardCommandAsync(() => {})
        expect(card.available).toBeTruthy()
        expect(card.usable).toBeTruthy()
        card.summon()
        expect(spy).toBeCalledTimes(1)
        cards.getSomeCardCommandAsync(() => {})
        const secondCard = cards.hand.cards[0]
        secondCard.activate()
        expect(spy).toBeCalledTimes(2)
        const thirdCard = cards.hand.cards[0]
        cards.getSomeCardCommandAsync(() => {})
        thirdCard.select()
        expect(spy).toBeCalledTimes(2)
    })

    test("take card from deck", () => {
        const card = cards.hand.cards[0]
        cards.getSomeCardCommandAsync((selected) => {
            expect(selected.target).toBe(card)
        })
        expect(cards.highlighted.size).toBe(7)
        expect(card.usable).toBeTruthy()
        expect(card.available).toBeTruthy()
        card.summon()
        expect(cards.hand.size).toBe(6)
        expect(cards.highlighted.size).toBe(0)
    })

    test("highlight cards", () => {
        const card = cards.hand.cards[0]
        cards.highlight(card)
        expect(card.highlighted).toBe(true)
        expect(cards.highlighted.size).toBe(1)
        cards.resetHighlights()
        expect(card.highlighted).toBe(false)
        expect(cards.highlighted.size).toBe(0)
    })

    test("highlight with click opportunity", () => {
        cards.highlightCardsSameGuild(GuildFactory.getInstance().create("AIR"))
        expect(cards.hand.cards[0].available).toBeTruthy()
        cards.highlightCardsByValue(5)
        expect(cards.hand.cards[0].available).toBeTruthy()
    })

    test("get cards by guild", () => {
        const needCard = cards.hand.cards[2]
        cards.getCardsSameGuildAsync(
            GuildFactory.getInstance().create("WATER"),
            (card) => {
                expect(card).toBe(needCard.mobData)
            }
        )
        needCard.select()
    })

    test("get cards by value", () => {
        const needCard = cards.hand.cards[2]
        cards.getCardsSameValueAsync(6, (card) => {
            expect(card).toBe(needCard.mobData)
        })
        needCard.select()
    })

    test("get card command auto draw test", () => {
        const decks: ServerUserDecks = {
            hand: [],
            left: [],
            deck: [],
        }

        cards = CardsControllerMapper.toDomain(decks)
        cards.getSomeCardCommandAsync(({ message }) => {
            expect(message).toBe(LOG_ACTIONS.draw)
        })
    })
})

describe("Node work tests", () => {
    let node: MapNode

    beforeEach(() => {
        node = new MapNode(stub, [user1, team1])
    })

    test("Node is creating with not-empty fields", () => {
        expect(node.fields.length).toBe(1)
    })

    test("Node field add new field", () => {
        node.addField()
        expect(node.fields.length).toBe(2)
        expect(node.fields[0].next).toBe(node.fields.at(-1))
        expect(node.fields.at(-1)!.prev).toBe(node.fields[0])
    })

    test("Node field delete", () => {
        node.addField()
        node.addField()
        expect(node.fields.length).toBe(3)
        const field = node.fields[1]!
        field.delete()
        expect(node.fields.length).toBe(2)
    })

    test("Node chain creation", () => {
        const node2 = node.createNextNode()
        const node3 = node2.createNextNode()
        expect(node.next).toBe(node2)
        expect(node2.next).toBe(node3)
        expect(node3.prev).toBe(node2)
        expect(node2.prev).toBe(node)
        const node4 = node3.createUpNode()
        const node5 = node4.createNextNode()
        expect(node3.up).toBe(node4)
        expect(node4.down).toBe(node3)
        expect(node5.prev).toBe(node4)
        expect(node4.next).toBe(node5)
    })

    test("when new elemental is created new field will be added", () => {
        expect(node.fields.length).toBe(1)
        node.lastField?.createElemental(
            new MobData(GuildFactory.getInstance().create("AIR"), 5)
        )
        expect(node.fields.length).toBe(2)
        expect(node.lastField?.elemental).toBeNull()
    })
})

describe("Fields controller work test", () => {
    let field: FieldsController = new FieldsController()
    const teams = [team1, team2]
    const userFields = new Map<User, ElementalCode[][]>()
    userFields.set(user1, [
        ["LAVA_5_0_2", "FIRE_5_0_4"],
        ["AIR_7_0_5", "LAVA_5_1_5", "MUSIC_5_0_3"],
        ["AIR_5_1_5"],
        ["AIR_5_2_5"],
        ["AIR_5_3_5"],
    ])
    userFields.set(user2, [
        [],
        [],
        ["FIRE_5_1_5"],
        ["WATER_5_0_4", "FIRE_7_1_7", "LIGHT_5_0_2"],
        ["LIGHT_5_1_5", "DARK_6_0_5"],
    ])
    const turn = new Turn(teams, user1, user1)
    const builder = new GameContentBuilder(turn).createGameField(userFields)
    field = builder.gameField
    field.setEnabled(true)
    field.setClickable(true)
    field.setHighlightable(true)

    const first = field.startNode.next!
    const second = first.next!
    const third = second.next!
    const fourth = third.next!
    const fifth = fourth.next!
    const firstE = first.up!
    const secondE = second.up!
    const thirdE = third.up!
    const fourthE = fourth.up!
    // const fifthE = fifth.up!
    const firstFields = first.fields
    const secondFields = second.fields
    const thirdFields = third.fields
    const fourthFields = fourth.fields
    const fifthFields = fifth.fields
    const firstEFields = firstE.fields
    const secondEFields = secondE.fields
    const thirdEFields = thirdE.fields
    // const fourthEFields = fourthE.fields
    // const fifthEFields = fifthE.fields
    const firstField = firstFields[0]
    const secondField = secondFields[0]
    const thirdField = thirdFields[0]
    const fourthField = fourthFields[0]
    const fifthField = fifthFields[0]
    const air5 = new MobData(GuildFactory.getInstance().create("AIR"), 5)
    const lava7 = new MobData(GuildFactory.getInstance().create("LAVA"), 7)
    const water6 = new MobData(GuildFactory.getInstance().create("WATER"), 6)

    afterEach(() => {
        field.reset()
    })

    test("return immediately field when there is only one variant", () => {
        field.getNeighBoorEnemyFirstElementalAsync(fourthField, (found) => {
            expect(found).toBe(thirdEFields[0])
        })
    })

    test("get enemy first elemental field in this col sync work test", () => {
        let found = field.getFirstEnemyElementalFieldInThisColSync(firstField)
        expect(found).toBe(firstEFields[0])
        found = field.getLastEnemyElementalInThisColSync(fourthFields[0])
        expect(found).toBeNull()
    })

    test("get last elemental field in this col sync work test", () => {
        let found = field.getLastEnemyElementalInThisColSync(firstFields[0])
        expect(found).toBe(firstEFields[1])
        found = field.getLastEnemyElementalInThisColSync(thirdFields[0])
        expect(found).toBe(thirdEFields[0])
        found = field.getLastEnemyElementalInThisColSync(fourthFields[0])
        expect(found).toBeNull()
    })

    test("get neighbor enemy first elemental async work test", () => {
        field.getNeighBoorEnemyFirstElementalAsync(fourthField, (found) => {
            expect(found).toBe(thirdEFields[0])
        })
        field.getNeighBoorEnemyFirstElementalAsync(fifthField, (found) => {
            expect(found).toBeNull()
        })
        const selected = thirdEFields[0]
        field.getNeighBoorEnemyFirstElementalAsync(secondField, (found) => {
            expect(found).toBe(selected)
        })
        selected.select()
    })

    test("get all neighbor enemy first elementals sync", () => {
        let found = field.getAllNeighBoorEnemyFirstElementalsSync(secondField)
        expect(found.length).toBe(2)
        expect(found[0]).toBe(thirdEFields[0])
        expect(found[1]).toBe(firstEFields[0])
        found = field.getAllNeighBoorEnemyFirstElementalsSync(fourthField)
        expect(found.length).toBe(1)
        expect(found[0]).toBe(thirdEFields[0])
        found = field.getAllNeighBoorEnemyFirstElementalsSync(fifthField)
        expect(found.length).toBe(0)
    })

    test("get my any elemental in this node async", () => {
        const selected = secondFields[1]
        field.getAnyElementalInThisNodeAsync(secondField, (found) => {
            expect(found).toBe(selected)
        })
        expect(field.highlighted.size).toBe(2)
        selected.select()
    })

    test("get my elementals by value async work test", () => {
        field.getTeamElementalsByValueAsync(team1, air5, [], (found) => {
            expect(found).toBe(firstFields[0])
        })
        const selected = field.startNode.next!.fields[0]
        expect(selected.highlighted).toBeTruthy()
        expect(field.highlighted.size).toBe(7)
        selected.select()
        expect(field.highlighted.size).toBe(0)
        field.getTeamElementalsByValueAsync(
            team1,
            lava7,
            [],
            (field) => {
                expect(field).toBe(secondField)
            },
            { autoReturn: true }
        )
        field.getTeamElementalsByValueAsync(
            team1,
            water6,
            [],
            (field) => {
                expect(field).toBeNull()
            },
            { autoReturn: true }
        )

        expect(field.highlighted.size).toBe(0)
        field.getTeamElementalsByValueAsync(
            team1,
            air5,
            [fifthField.elemental!],
            (field) => {
                expect(field).toBe(secondField)
            }
        )
        expect(field.highlighted.size).toBe(6)
        field.reset()
        field.getTeamElementalsByValueAsync(
            team1,
            air5,
            [fifthField.elemental!, fourthField.elemental!],
            (field) => {
                expect(field).toBe(secondField)
            }
        )
        expect(field.highlighted.size).toBe(5)
    })

    test("get my elementals by guild async work test", () => {
        let selected = thirdField
        field.getTeamElementalByGuildAsync(team1, air5, [], (field) => {
            expect(field).toBe(selected)
        })
        expect(field.highlighted.size).toBe(4)
        selected.select()
        selected = firstField
        field.getTeamElementalByGuildAsync(team1, lava7, [], (found) => {
            expect(found).toBe(selected)
        })
        expect(field.highlighted.size).toBe(2)
        selected.select()
        field.getTeamElementalByGuildAsync(team1, water6, [], (field) => {
            expect(field).toBeNull()
        })
        expect(field.highlighted.size).toBe(0)
        field.getTeamElementalByGuildAsync(
            team1,
            air5,
            [fifthField.elemental!],
            (field) => {
                expect(field).toBe(selected)
            }
        )
        expect(field.highlighted.size).toBe(3)
    })

    test("get last field in node work test", () => {
        const found = field.getLastFieldInNode(first)
        expect(found).toBe(firstFields[2])
    })

    test("get first elemental in node", () => {
        let found = field.getFirstFieldWithElementalInNode(first)
        expect(found).toBe(firstFields[0])
        found = field.getFirstFieldWithElementalInNode(fourthE)
        expect(found).toBeNull()
    })

    test("get my any last empty field async work test", () => {
        field.getTeamAnyLastEmptyFieldAsync(team1, [first], (_) => {})
        expect(field.highlighted.size).toBe(4)
        field.reset()
        field.getTeamAnyLastEmptyFieldAsync(team1, [], (_) => {})
        expect(field.highlighted.size).toBe(5)
    })

    test("get enemy first elementals in three cols sync work test", () => {
        let found = field.getEnemyFirstElementalsInThreeColsSync(firstField)
        expect(found.length).toBe(2)
        expect(found[0]).toBe(firstEFields[0])
        found = field.getEnemyFirstElementalsInThreeColsSync(secondField)
        expect(found.length).toBe(3)
        found = field.getEnemyFirstElementalsInThreeColsSync(fourthField)
        expect(found.length).toBe(1)
        expect(found[0]).toBe(thirdEFields[0])
        found = field.getEnemyFirstElementalsInThreeColsSync(fifthField)
        expect(found.length).toBe(0)
    })

    test("get fields before sync work test", () => {
        let found = field.getFieldsWithElementalBeforeSync(firstFields[1])
        expect(found.length).toBe(1)
        expect(found[0]).toBe(firstField)
        found = field.getFieldsWithElementalBeforeSync(firstFields[0])
        expect(found.length).toBe(0)
    })

    test("get fields after sync work test", () => {
        let found = field.getFieldsWithElementalAfterSync(secondFields[1])
        expect(found.length).toBe(1)
        expect(found[0]).toBe(secondFields[2])
        found = field.getFieldsWithElementalAfterSync(secondFields[2])
        expect(found.length).toBe(0)
    })

    test("get my neighbor last empty field async work test", () => {
        field.getNeighBoorLastEmptyFieldAsync(firstField, (found) => {
            expect(found).toBe(secondFields[3])
        })
        let selected = secondFields[3]
        field.getNeighBoorLastEmptyFieldAsync(secondField, (found) => {
            expect(found).toBe(selected)
        })
        expect(field.highlighted.size).toBe(2)
        selected.select()
        field.reset()
        field.getNeighBoorLastEmptyFieldAsync(
            [secondField, thirdField],
            (found) => {
                expect(found).toBe(selected)
            }
        )
        expect(field.highlighted.size).toBe(2)
        expect(firstFields[2].highlighted).toBeTruthy()
        expect(fourthFields[1].highlight).toBeTruthy()
        selected.select()
    })

    test("format field for codes arrays", () => {
        const teams = [team1, team2]
        const userFields = new Map<User, ElementalCode[][]>()
        const user1Fields: ElementalCode[][] = [
            [],
            ["AIR_7_0_5", "LAVA_5_1_5", "MUSIC_5_0_3"],
            ["AIR_5_1_5"],
            [],
            [],
        ]
        const user2Fields: ElementalCode[][] = [
            [],
            [],
            ["FIRE_5_1_5"],
            ["WATER_5_0_4", "FIRE_7_1_7", "LIGHT_5_0_2"],
            ["LIGHT_5_1_5", "DARK_6_0_5"],
        ]
        userFields.set(user1, user1Fields)
        userFields.set(user2, user2Fields)
        const turn = new Turn(teams, user1, user1)
        const builder = new GameContentBuilder(turn).createGameField(userFields)
        const fieldsController = builder.gameField
        expect(FieldsControllerMapper.toEntity(fieldsController)).toEqual(
            userFields
        )
    })

    test("get last neighbor add current async  work test", () => {
        let selected = secondFields[3]
        field.getLastNeighBoorsAndCurrentEmptyFieldAsync(
            [secondField],
            (found) => {
                expect(found).toBe(selected)
            }
        )
        expect(field.highlighted.size).toBe(3)
        expect(firstFields[2].highlighted).toBeTruthy()
        selected.select()
    })

    test("get enemy any elemental in this node work test", () => {
        field.getEnemyAnyElementalInThisNodeAsync(secondField, (_) => {})
        expect(field.highlighted.size).toBe(3)
        expect(secondEFields[0].highlighted).toBeTruthy()
        expect(secondEFields[1].highlighted).toBeTruthy()
        expect(secondEFields[2].highlighted).toBeTruthy()
    })

    test("get my any elemental async work test", () => {
        field.getTeamAnyElementalAsync(team1, [], (_) => {})
        expect(field.highlighted.size).toBe(8)
        field.reset()
        field.getTeamAnyElementalAsync(team1, [firstField], (_) => {})
        expect(field.highlighted.size).toBe(7)
        expect(firstField.available).toBeFalsy()
    })

    test("get enemy all elementals in this node sync work test", () => {
        let found = field.getEnemyAllElementalsInThisNodeSync(secondField)
        expect(found.length).toBe(3)
        found = field.getEnemyAllElementalsInThisNodeSync(fourthField)
        expect(found.length).toBe(0)
    })

    test("get concrete field sync work test", () => {
        let found = field.getConcreteFieldSync("1_0_FIRE_5_0_4")
        expect(found).toBe(firstFields[1])
    })

    test("transfer elemental to new field work test", () => {
        const teams = [team1, team2]
        const userFields = new Map<User, ElementalCode[][]>()
        userFields.set(user1, [
            ["LAVA_5_0_2", "FIRE_5_0_4"],
            ["AIR_7_0_5", "LAVA_5_0_5", "MUSIC_5_0_3"],
            ["AIR_5_0_5"],
            ["AIR_5_0_5"],
            ["AIR_5_0_5"],
        ])
        userFields.set(user2, [
            ["LIGHT_5_0_5", "DARK_6_0_5"],
            ["WATER_5_0_4", "FIRE_7_0_7", "LIGHT_5_0_2"],
            ["FIRE_5_0_5"],
            [],
            [],
        ])
        const turn = new Turn(teams, user1, user1)
        const builder = new GameContentBuilder(turn).createGameField(userFields)
        field = builder.gameField
        field.setEnabled(true)
        const first = field.startNode.next!
        let firstFields = first.fields
        const firstField = firstFields[0]
        const firstElementInFirstCol = firstFields[0].elemental
        const secondElementalInFirstCol = firstFields[1].elemental
        const third = first.next!.next!
        const thirdFields = third.fields
        const fifth = third.next!.next!
        let fifthFields = fifth.fields
        expect(firstFields.length).toBe(3)
        field.transferElementalToNewField(firstField, thirdFields[1])
        firstFields = field.startNode.next!.fields
        expect(firstFields[0].elemental).toBe(secondElementalInFirstCol)
        expect(thirdFields.length).toBe(3)
        expect(firstFields.length).toBe(2)
        expect(thirdFields[1].elemental).toBe(firstElementInFirstCol)
        let secondFields = first.next!.fields
        const lastElementalInSecondCol = secondFields[2].elemental
        field.transferElementalToNewField(secondFields[2], fifthFields[1])
        secondFields = first.next!.fields
        fifthFields = fifth.fields
        expect(secondFields.length).toBe(3)
        expect(secondFields[2].elemental).toBeNull()
        expect(fifthFields[1].elemental).toBe(lastElementalInSecondCol)
        expect(fifthFields.length).toBe(3)
    })
})

describe("Turn work tests", () => {
    test("viewer check", () => {
        const turn = new Turn(teams1, user3, user3)
        expect(turn.isViewer).toBeTruthy()
    })

    test("next function work for 2 players", () => {
        const turn = new Turn(teams1, user1, user1)
        expect(turn.currentTurn).toBe(user1)
        expect(turn.isViewer).toBeFalsy()
        turn.next()
        expect(turn.currentTurn).toBe(user2)
        turn.next()
        expect(turn.currentTurn).toBe(user1)
    })

    test("next function work for 3 players", () => {
        const turn = new Turn(teams2, user1, user1)
        expect(turn.currentTurn).toBe(user1)
        turn.next()
        expect(turn.currentTurn).toBe(user3)
        turn.next()
        expect(turn.currentTurn).toBe(user1)
        turn.next()
        expect(turn.currentTurn).toBe(user4)
        turn.next()
        expect(turn.currentTurn).toBe(user1)
    })

    test("next function work for 4 players", () => {
        const turn = new Turn(teams3, user1, user1)
        expect(turn.currentTurn).toBe(user1)
        turn.next()
        expect(turn.currentTurn).toBe(user3)
        turn.next()
        expect(turn.currentTurn).toBe(user2)
        turn.next()
        expect(turn.currentTurn).toBe(user4)
        turn.next()
        expect(turn.currentTurn).toBe(user1)
    })

    test("grouping by teams for current player", () => {
        const turn1 = new Turn(teams3, user1)
        const groups = turn1.groupedTeamsInRightOrder

        expect(groups[0][0][0]).toBe(user1)
        expect(groups[0][1][0]).toBe(user2)
        expect(groups[1][0][0]).toBe(user4)
        expect(groups[1][1][0]).toBe(user3)

        const turn2 = new Turn(teams3, user3)
        const groups2 = turn2.groupedTeamsInRightOrder

        expect(groups2[0][0][0]).toBe(user3)
        expect(groups2[0][1][0]).toBe(user4)
        expect(groups2[1][0][0]).toBe(user2)
        expect(groups2[1][1][0]).toBe(user1)

        const turn3 = new Turn(teams2, user3)
        const groups3 = turn3.groupedTeamsInRightOrder

        expect(groups3[0][0][0]).toBe(user3)
        expect(groups3[0][1][0]).toBe(user4)
        expect(groups3[1][0][0]).toBe(user1)

        const turn4 = new Turn(teams3, user2)
        const groups4 = turn4.groupedTeamsInRightOrder

        expect(groups4[0][0][0]).toBe(user2)
        expect(groups4[0][1][0]).toBe(user1)
        expect(groups4[1][0][0]).toBe(user3)
        expect(groups4[1][1][0]).toBe(user4)
    })

    test("random first turn", () => {
        const turn = new Turn(teams3, user1)
        expect(turn.currentTurn).toBeDefined()
    })
})

describe("GuildsPoolController work tests", () => {
    let controller: GuildsPoolController
    let initGuildsCount: number

    beforeEach(() => {
        controller = new GuildsPoolController()
        controller.setGuilds(
            GuildFactory.getInstance().createSeveral(BASE_GUILDS_CODE as any)
        )
        controller.setEnabled(true)
        controller.setHighlightable(true)
        controller.setClickable(true)
        initGuildsCount = controller.guilds.length
    })

    test("highlight guilds card", () => {
        controller.highlightGuilds()
        controller.guilds.forEach((card) =>
            expect(card.highlighted).toBeTruthy()
        )
        expect(controller.highlighted.size).toBe(BASE_GUILDS_CODE.length)
    })

    test("reset highlights", () => {
        controller.highlightGuilds()
        expect(controller.highlighted.size).toBe(BASE_GUILDS_CODE.length)
        controller.reset()
        controller.guilds.forEach((card) =>
            expect(card.highlighted).toBeFalsy()
        )
        expect(controller.highlighted.size).toBe(0)
    })

    test("take random guild async", () => {
        controller.getGuildAsync((guild) => {
            expect(guild).toBeInstanceOf(Guild)
        })
        controller.takeRandomGuildAsync()
        expect(controller.guilds.length).toBe(initGuildsCount - 1)
        controller.setGuilds([])
        controller.getGuildAsync((guild) => {
            expect(guild).toBeNull()
        })
        controller.takeRandomGuildAsync()
    })

    test("take random guild sync", () => {
        let guild = controller.takeRandomGuildSync()
        expect(controller.guilds.length).toBe(initGuildsCount - 1)
        expect(guild).toBeInstanceOf(Guild)
        controller.setGuilds([])
        guild = controller.takeRandomGuildSync()
        expect(guild).toBeNull()
    })

    test("take concrete guild async", () => {
        controller.getGuildAsync((guild) => {
            debugger
            expect(guild).toBeInstanceOf(FireGuild)
            expect(guild.code).toBe("FIRE")
        })
        controller.getConcreteGuildAsync("FIRE")
        expect(controller.guilds.length).toBe(initGuildsCount - 1)
        controller.getGuildAsync((guild) => {
            expect(guild).toBeNull()
        })
        controller.getConcreteGuildAsync("COMET")
    })

    test("take guild async", () => {
        controller.getGuildAsync((guild) => {
            expect(guild).toBeInstanceOf(Guild)
        })
        controller.guilds[0].select()
        expect(controller.guilds.length).toBe(initGuildsCount - 1)
    })

    test("format pool to codes array", () => {
        expect(GuildsPoolMapper.toEntity(controller)).toBeInstanceOf(Array)
    })
})

export class IStageControllerStub implements IStageController {
    start = jest.fn()
    stop = jest.fn()
    setStage = jest.fn()
    getStage = jest.fn()
}

const gameStateControllerStub = new InGameStageController(
    new IStageControllerStub(),
    true
)

describe("GuildsFactory work test", () => {
    test("created guild has code", () => {
        const code: GuildCode = "ACID"
        const guild = GuildFactory.getInstance().create(code)
        expect(guild.code).toBe(code)
    })

    test("factory create just one instance of guild", () => {
        const code: GuildCode = "ACID"
        const first = GuildFactory.getInstance().create(code)
        const second = GuildFactory.getInstance().create(code)
        expect(first).toBe(second)
    })
})

describe("UserDraft work test", () => {
    let draft: UserDraft

    beforeEach(() => {
        draft = new UserDraft(2)
    })

    test("choose guild", () => {
        draft.choose(GuildFactory.getInstance().create("AIR"))
        expect(draft.chosen.size).toBe(1)
    })

    test("ban guild", () => {
        draft.ban(GuildFactory.getInstance().create("AIR"))
        expect(draft.banned.size).toBe(1)
    })

    test("choose guild when guilds is full", () => {
        draft.choose(GuildFactory.getInstance().create("AIR"))
        draft.choose(GuildFactory.getInstance().create("ACID"))
        expect(draft.isDraftFull).toBeTruthy()
        draft.choose(GuildFactory.getInstance().create("WATER"))
        expect(draft.chosen.size).toBe(2)
    })
})

describe("DraftContentBuilder work tests", () => {
    test("guilds pool for different count of players in base case", () => {
        const turn1 = new Turn(teams1, user1)
        const turn2 = new Turn(teams2, user1)
        const turn3 = new Turn(teams3, user1)
        const poolSize1 = new DraftContentBuilder(turn1).formatGuildsPool(false)
            .guilds.guilds.length
        const poolSize2 = new DraftContentBuilder(turn2).formatGuildsPool(false)
            .guilds.guilds.length
        const poolSize3 = new DraftContentBuilder(turn3).formatGuildsPool(false)
            .guilds.guilds.length
        expect(poolSize1).toBe(10)
        expect(poolSize2).toBe(12)
        expect(poolSize3).toBe(14)
    })

    test("guilds pool with ban and without", () => {
        const turn1 = new Turn(teams1, user1)
        const poolSize1 = new DraftContentBuilder(turn1).formatGuildsPool(true)
            .guilds.guilds.length
        const poolSize2 = new DraftContentBuilder(turn1).formatGuildsPool(false)
            .guilds.guilds.length
        expect(poolSize1).toBe(18)
        expect(poolSize2).toBe(10)
    })

    test("guilds pool with extension and without", () => {
        const turn1 = new Turn(teams1, user1)
        const poolSize1 = new DraftContentBuilder(turn1).formatGuildsPool(true)
            .guilds.guilds.length
        const poolSize2 = new DraftContentBuilder(turn1).formatGuildsPool(false)
            .guilds.guilds.length
        expect(poolSize1).toBe(18)
        expect(poolSize2).toBe(10)
    })

    test("init guilds draft with first random guild", () => {
        const turn1 = new Turn(teams1, user1)
        const builder = new DraftContentBuilder(turn1)
            .formatGuildsPool(false)
            .setMaxCountOfGuildsPerUser(4)
            .addUsersRandomGuild()

        for (let draft of builder.usersDraft.values()) {
            expect(draft.chosen.size).toBe(1)
        }
        expect(builder.guilds.guilds.length).toBe(8)
    })

    test("count of guilds must be in borders of guilds pool", () => {
        const turn1 = new Turn(teams2, user1)
        const builder = new DraftContentBuilder(turn1)
            .formatGuildsPool(true)
            .setMaxCountOfGuildsPerUser(10)

        expect(builder.usersDraft.get(user1)?.maxChosenCount).toBe(8)
        expect(builder.usersDraft.get(user3)?.maxChosenCount).toBe(4)
        expect(builder.usersDraft.get(user4)?.maxChosenCount).toBe(4)

        const turn2 = new Turn(teams1, user1)
        const builder2 = new DraftContentBuilder(turn2)
            .formatGuildsPool(false)
            .setMaxCountOfGuildsPerUser()

        expect(builder2.usersDraft.get(user1)?.maxChosenCount).toBe(5)
        expect(builder2.usersDraft.get(user2)?.maxChosenCount).toBe(5)

        const builder3 = new DraftContentBuilder(turn2)
            .formatGuildsPool(false)
            .addUsersRandomGuild(1)
            .setMaxCountOfGuildsPerUser()

        expect(builder3.usersDraft.get(user1)?.maxChosenCount).toBe(4)
        expect(builder3.usersDraft.get(user2)?.maxChosenCount).toBe(4)
    })

    test("check draft stages template availability", () => {
        const turn1 = new Turn(teams1, user1)
        const builder = new DraftContentBuilder(turn1).formatGuildsPool(true)
        expect(builder.guilds.guilds.length).toBe(18)
        expect(builder.checkDraftTemplate([])).toBe(false)
        expect(builder.checkDraftTemplate([DraftStage.pick])).toBe(true)
        expect(builder.checkDraftTemplate([DraftStage.ban])).toBe(false)
        expect(
            builder.checkDraftTemplate([DraftStage.pick, DraftStage.ban])
        ).toBe(true)
        expect(
            builder.checkDraftTemplate([
                DraftStage.pick,
                DraftStage.ban,
                DraftStage.ban,
            ])
        ).toBe(true)
        expect(
            builder.checkDraftTemplate(
                [DraftStage.pick, DraftStage.ban, DraftStage.ban],
                4
            )
        ).toBe(false)
        expect(
            builder.checkDraftTemplate([
                DraftStage.pick,
                DraftStage.ban,
                DraftStage.ban,
                DraftStage.ban,
                DraftStage.ban,
                DraftStage.ban,
                DraftStage.ban,
                DraftStage.ban,
                DraftStage.ban,
                DraftStage.ban,
            ])
        ).toBe(false)
        expect(
            builder.checkDraftTemplate([
                DraftStage.pick,
                DraftStage.ban,
                DraftStage.pick,
                DraftStage.ban,
                DraftStage.pick,
                DraftStage.ban,
                DraftStage.ban,
                DraftStage.pick,
            ])
        ).toBe(true)
    })

    test("parse guilds pool", () => {
        const turn1 = new Turn(teams1, user1)
        const builder = new DraftContentBuilder(turn1).parseGuildsPool([
            "AIR",
            "MUSIC",
        ])
        expect(builder.guilds.guilds.length).toBe(2)
        expect(builder.guilds.guilds[0].guild).toBeInstanceOf(AirGuild)
        expect(builder.guilds.guilds[1].guild).toBeInstanceOf(MusicGuild)
    })

    test("parse guilds draft", () => {
        const turn1 = new Turn(teams1, user1)
        const userDrafts = new Map<User, ServerUserPicks>()
        userDrafts.set(user1, {
            picks: ["AIR"],
            bans: ["ACID"],
        })
        userDrafts.set(user2, {
            picks: ["LAVA", "LIGHT"],
            bans: [],
        })
        const builder = new DraftContentBuilder(turn1).parseUserDrafts(
            userDrafts
        ).usersDraft
        expect(builder.get(user1)?.chosen.size).toBe(1)
        expect(builder.get(user1)?.banned.size).toBe(1)
        expect(builder.get(user2)?.chosen.size).toBe(2)
        expect(builder.get(user2)?.banned.size).toBe(0)
    })
})

describe("GameContentBuilder work tests", () => {
    describe("Game field for different count of players", () => {
        test("game field for 2 players", () => {
            const turn = new Turn(teams1, user1, user1)
            const countOfNodesByUser: Map<User, number> = new Map()
            const gameField = new GameContentBuilder(turn).createGameField()
                .gameField

            expect(gameField.startNode).toBeDefined()
            expect(gameField.startNode.next).toBeTruthy()
            expect(gameField.startNode!.next!.user![0]).toBe(user1)
            expect(gameField.startNode!.next!.up!.user![0]).toBe(user2)
            expect(gameField.startNode!.next!.next!.user![0]).toBe(user1)
            expect(gameField.startNode!.next!.next!.up!.user![0]).toBe(user2)
            expect(gameField.startNode.fields.length).toBe(0)
            expect(gameField.startNode.next?.fields.length).toBe(1)
            expect(
                gameField.startNode.next!.next!.next!.next!.next!.next?.user
            ).toBeFalsy()

            gameField.iterateThroughAllNodes((node) => {
                if (node.user) {
                    countOfNodesByUser.set(
                        node.user[0],
                        (countOfNodesByUser.get(node.user[0]) || 0) + 1
                    )
                }
            })

            gameField.iterateThroughTeamNodes((node) => {
                expect(node.up).toBeDefined()
            }, team1)

            expect(countOfNodesByUser.get(user1)).toBe(5)
            expect(countOfNodesByUser.get(user2)).toBe(5)
        })

        test("game field for 3 players", () => {
            const turn = new Turn(teams2, user1)
            const countOfNodesByUser: Map<User, number> = new Map()
            const gameField = new GameContentBuilder(turn).createGameField()
                .gameField

            gameField.iterateThroughAllNodes((node) => {
                if (node.user) {
                    countOfNodesByUser.set(
                        node.user[0],
                        (countOfNodesByUser.get(node.user[0]) || 0) + 1
                    )
                }
            })

            gameField.iterateThroughTeamNodes((node) => {
                expect(node.up).toBeDefined()
            }, team1)

            expect(countOfNodesByUser.get(user1)).toBe(6)
            expect(countOfNodesByUser.get(user3)).toBe(3)
            expect(countOfNodesByUser.get(user4)).toBe(3)
        })

        test("game field for 4 players", () => {
            const turn = new Turn(teams3, user1)
            const countOfNodesByUser: Map<User, number> = new Map()
            const gameField = new GameContentBuilder(turn).createGameField()
                .gameField

            gameField.iterateThroughAllNodes((node) => {
                if (node.user) {
                    countOfNodesByUser.set(
                        node.user[0],
                        (countOfNodesByUser.get(node.user[0]) || 0) + 1
                    )
                }
            })

            gameField.iterateThroughTeamNodes((node) => {
                expect(node.up).toBeDefined()
            }, team3)

            expect(countOfNodesByUser.get(user1)).toBe(3)
            expect(countOfNodesByUser.get(user2)).toBe(3)
            expect(countOfNodesByUser.get(user3)).toBe(3)
            expect(countOfNodesByUser.get(user4)).toBe(3)
        })
    })

    test("create game field with fields", () => {
        const turn = new Turn(teams1, user1)
        const usersFields: Map<User, ElementalCode[][]> = new Map()
        usersFields.set(user1, [[], [], [], [], []])
        usersFields.set(user2, [[], [], [], [], ["AIR_5_0_4"]])
        const gameField = new GameContentBuilder(turn).createGameField(
            usersFields
        ).gameField
        const secondUserFields = gameField.startNode.prev!.fields
        expect(secondUserFields.length).toBe(2)
        const firstUserElemental = secondUserFields[0].elemental!
        expect(firstUserElemental.guild.code).toBe("AIR")
        expect(firstUserElemental.maxHealth).toBe(5)
        expect(firstUserElemental.health).toBe(4)
    })

    test("parse game deck", () => {
        const turn = new Turn(teams1, user1)
        const decks = new Map<User, ServerUserDecks>()
        decks.set(user1, {
            hand: [],
            left: [],
            deck: [],
        })
        decks.set(user2, {
            hand: ["AIR_7_0", "AIR_5_1"],
            left: ["ICE_5_2"],
            deck: ["FIRE_6_1"],
        })

        const cards = new GameContentBuilder(turn).parseUserDecks(
            decks
        ).userCards
        const secondUserDecks = cards.get(user2)!
        expect(secondUserDecks?.left.size).toBe(1)
        expect(secondUserDecks?.hand.size).toBe(2)
        expect(secondUserDecks?.left.size).toBe(1)
        const firstCardInDeck = secondUserDecks.hand.cards[0].mobData
        expect(firstCardInDeck.guild.code).toBe("AIR")
        expect(firstCardInDeck.value).toBe(7)
        expect(secondUserDecks.hand.cards[0]).toBeInstanceOf(Card)
    })

    test("format init users decks", () => {
        const usersDrafts = new Map<User, UserDraft>()
        const draft1 = new UserDraft()
        GuildFactory.getInstance()
            .createSeveral(["ACID", "AIR", "BEAST", "COMET"])
            .forEach((guild) => {
                draft1.choose(guild)
            })
        const draft2 = new UserDraft()
        usersDrafts.set(user1, draft1)
        usersDrafts.set(user2, draft2)
        const turn = new Turn(teams1, user1)
        const cards = new GameContentBuilder(turn).formatInitDecks(
            usersDrafts
        ).userCards
        const user1Cards = cards.get(user1)!
        expect(user1Cards.total.size).toBe(29)
        expect(user1Cards.hand.size).toBe(7)
    })

    test("add random card to center", () => {
        const turn = new Turn(teams1, user1)
        const usersDrafts = new Map<User, UserDraft>()
        const draft1 = new UserDraft()
        GuildFactory.getInstance()
            .createSeveral(["ACID", "AIR", "BEAST", "COMET"])
            .forEach((guild) => {
                draft1.choose(guild)
            })
        const draft2 = new UserDraft()
        GuildFactory.getInstance()
            .createSeveral(["WATER", "LIGHT", "DARK", "MUSIC"])
            .forEach((guild) => {
                draft2.choose(guild)
            })
        usersDrafts.set(user1, draft1)
        usersDrafts.set(user2, draft2)
        const field = new GameContentBuilder(turn)
            .createGameField()
            .formatInitDecks(usersDrafts)
            .addCardToCenter().gameField
        const centerFields = field.startNode.next!.next!.next!.fields
        expect(centerFields.length).toBe(2)
        expect(centerFields[0].elemental).toBeTruthy()
    })
})

describe("Iterator work test", () => {
    const nodes = new MapNode(stub)
    const lastNodeInLine = nodes
        .createNextNode([user1, team1], 1)
        .createNextNode([user1, team1], 2)
        .createNextNode(undefined, 3)
    const last = lastNodeInLine
        .createNextNode([user1, team1], 4)
        .createNextNode([user1, team1], 5)
        .createNextNode([user1, team1], 6)
    nodes.prev = last
    last.next = nodes
    const iterator = new Iterator()

    test("iterate through line", () => {
        let countOfIterations = 0
        const finish = iterator.iterateThroughLine(
            nodes.next!,
            (_) => countOfIterations++
        )
        expect(countOfIterations).toBe(2)
        expect(finish).toBe(lastNodeInLine.prev!)
        const finish2 = iterator.iterateThroughLine(
            lastNodeInLine.next!,
            (_) => {},
            nodes
        )
        expect(finish2.index).toBe(0)
    })

    test("iterate through around", () => {
        let countOfIterations = 0
        iterator.iterateThroughRound(nodes.next!, (_) => countOfIterations++)
        expect(countOfIterations).toBe(7)
    })
})

describe("Guild work test", () => {
    let fields: FieldsController
    let points: PointsManager
    let killer: Killer
    let cards: UsersCards
    let concreteCards: CardsController
    type FieldCodePayload = {
        pos: number
        guild: GuildCode
        value?: number
        index?: number
        health?: number
    }
    const formatFieldCode = (
        user: User,
        { pos, guild, value = 5, index = 0, health = value }: FieldCodePayload
    ) => {
        return Field.parseCode(
            MapNode.parseCode(user.id, pos),
            Elemental.parseCode(MobData.parseCode(guild, value, index), health)
        )
    }

    const formatUser1FieldCode = (data: FieldCodePayload) => {
        return formatFieldCode(user1, data)
    }

    const getElementalsCode = (
        code: GuildCode[],
        {
            value = 5,
            index,
            health = value,
        }: Omit<FieldCodePayload, "pos" | "guild">
    ) =>
        code.map((code) =>
            Elemental.parseCode(MobData.parseCode(code, value, index), health)
        )
    const teams = [team1, team2]
    const turn = new Turn(teams, user1, user1)

    const user1BaseEls = [
        getElementalsCode(["ICE", "FIRE", "WATER", "LOVE"], { health: 4 }),
        getElementalsCode(["ACID", "MAGNETIC", "MUSIC", "LIGHTNING"], {}),
        getElementalsCode(["CRYSTAL", "COMET", "LAVA"], {}),
        getElementalsCode(["LIGHT", "FLORA", "GROUND"], {}),
        getElementalsCode(["AIR", "DARK", "SAND", "BEAST"], { health: 4 }),
    ]

    const user2BaseEls = [
        ["CRYSTAL_5_0_1"],
        ["FIRE_5_0_5", "AIR_5_0_5"],
        ["FIRE_5_1_5"],
        ["FIRE_5_2_5", "LAVA_5_0_5", "COMET_6_0_6"],
        ["FIRE_5_3_5", "FIRE_7_5_7"],
    ] as ElementalCode[][]

    beforeEach(() => {
        const userFields = new Map<User, ElementalCode[][]>()
        userFields.set(user1, user1BaseEls)
        userFields.set(user2, user2BaseEls)
        const userDecks = new Map<User, ServerUserDecks>()
        userDecks.set(user1, {
            left: [],
            hand: [
                "FIRE_5_0",
                "FIRE_5_0",
                "FIRE_5_0",
                "FIRE_5_0",
                "FIRE_5_0",
                "FIRE_5_0",
                "FIRE_5_0",
            ],
            deck: [
                "FIRE_5_0",
                "FIRE_5_0",
                "FIRE_5_0",
                "FIRE_5_0",
                "FIRE_5_0",
                "FIRE_5_0",
                "FIRE_5_0",
            ],
        })
        userDecks.set(user2, { left: [], hand: [], deck: [] })

        const builder = new GameContentBuilder(turn)
            .createGameField(userFields)
            .parseUserDecks(userDecks)

        fields = builder.gameField
        fields.setEnabled(true)
        cards = builder.userCards
        points = new PointsManager(turn)
        killer = new Killer(cards, points)
        concreteCards = cards.get(user1)!
    })

    let guid: Guild
    let currentCode: GuildCode = "FIRE"
    let currentPos = 0
    let activatedField: Field
    let spawnedField: Field

    const register = (code: GuildCode, pos: number) => {
        guid = GuildFactory.getInstance().create(code)
        currentCode = code
        currentPos = pos
    }

    const getMyField = (data: FieldCodePayload) => {
        return fields.getConcreteFieldSync(formatUser1FieldCode(data)!)!
    }

    const activateField = (field: Field) => {
        field.elemental?.guild.activate(
            field,
            fields,
            killer,
            concreteCards,
            () => {}
        )
    }

    const activate = (pos?: number) => {
        activatedField = getMyField({
            guild: currentCode,
            pos: pos || currentPos,
        })
        guid.activate(activatedField, fields, killer, concreteCards, () => {})
    }

    const spawn = () => {
        spawnedField = getMyField({ guild: currentCode, pos: currentPos })
        guid.spawn(spawnedField, fields, killer, concreteCards, () => {})
    }

    // const setEls = (user1Els: GuildCode[][], user2Els?: GuildCode[][]) => {
    //     const userFields = new Map<User, string[][]>()
    //     const parseData = (codes: GuildCode[][]) => {
    //         const finalCodes: string[][] = [[], [], [], [], []]
    //         codes.map((els, i) => {
    //             finalCodes[i] = getElementalsCode(els, i, {})
    //         })
    //         return finalCodes
    //     }
    //     userFields.set(user1, parseData(user1Els))
    //     userFields.set(user2, user2Els ? parseData(user2Els) : user2BaseEls)
    //     const builder = new GameContentBuilder(turn).createGameField(userFields)
    //     fields = builder.gameField
    // }

    // const checkDeckLeftCount = (value: number) => {
    //     expect(concreteCards.left.cards.length).toBe(value)
    // }

    const checkTeamPoint = (team: Team, value: number) => {
        expect(points.points.get(team)!).toBe(value)
    }

    const checkTeam1Point = (value: number) => {
        checkTeamPoint(team1, value)
    }

    const checkTeam2Point = (value: number) => {
        checkTeamPoint(team2, value)
    }

    const checkHighlighted = (value: number) => {
        expect(fields.highlighted.size).toBe(value)
    }

    const getFieldsByRowIndex = (row: number) => {
        const first = fields.startNode.next!
        const second = first.next!
        const third = second.next!
        const fourth = third.next!
        const fifth = fourth.next!
        switch (row) {
            case 0:
                return first
            case 1:
                return second
            case 2:
                return third
            case 3:
                return fourth
            case 4:
                return fifth
            default:
                return first
        }
    }

    const getMyFields = (row: number) => {
        return getFieldsByRowIndex(row).fields
    }

    const getEnemyFields = (row: number) => {
        return getFieldsByRowIndex(row).up!.fields
    }

    const getMyLastField = (row: number) => {
        return getFieldsByRowIndex(row).lastField!
    }

    const getEnemyFirstField = (row: number) => {
        return getEnemyFields(row)[0]
    }

    const checkEnemyLength = (row: number, val: number) => {
        expect(getEnemyFields(row).length).toBe(val + 1)
    }

    const checkMyLength = (row: number, val: number) => {
        expect(getMyFields(row).length).toBe(val + 1)
    }

    const checkHealth = (field: Field, health: number) => {
        expect(field.elemental!.health).toBe(health)
    }

    const checkFirstEnemyHealth = (row: number, health: number) => {
        checkHealth(getEnemyFirstField(row), health)
    }

    const checkEnemyHealth = (row: number, index: number, health: number) => {
        checkHealth(getEnemyFields(row)[index], health)
    }

    describe("Ground guild", () => {
        beforeEach(() => {
            register("GROUND", 3)
        })
        test("activation", () => {
            checkEnemyLength(currentPos, 2)
            activate()
            checkFirstEnemyHealth(currentPos, 3)
        })
        test("spawn", () => {
            spawn()
            checkFirstEnemyHealth(currentPos, 4)
            checkEnemyHealth(currentPos, 1, 4)
        })
    })

    describe("Crystal guild", () => {
        beforeAll(() => {
            register("CRYSTAL", 2)
        })

        test("activation", () => {
            checkTeam1Point(0)
            getEnemyFirstField(currentPos).elemental?.healToMax()
            activate()
            checkTeam1Point(0)
            checkFirstEnemyHealth(currentPos, 1)
            const enemy = getEnemyFirstField(currentPos)
            activateField(enemy)
            activateField(enemy)
            checkTeam2Point(2)
        })
    })

    describe("Ice guild", () => {
        beforeAll(() => {
            register("ICE", 0)
        })

        test("activation", () => {
            activate()
            checkEnemyHealth(currentPos, 1, 6)
            activate()
            checkEnemyHealth(currentPos, 1, 2)
        })
    })
    describe("Fire guild", () => {
        beforeAll(() => {
            register("FIRE", 0)
        })

        test("activation", () => {
            activate()
            const fieldUnderAttack = activatedField.next!
            checkHealth(fieldUnderAttack, 3)
            checkFirstEnemyHealth(0, 2)
            activate()
            checkEnemyLength(0, 1)
            checkTeam1Point(1)
            activate()
            activate()
            activate()
            checkTeam2Point(1)
        })
    })

    describe("Flora guild", () => {
        beforeAll(() => {
            register("FLORA", 3)
        })
        test("activation", () => {
            activate()
            checkHighlighted(2)
            getEnemyFirstField(2).select()
            checkEnemyLength(currentPos, 3)
            checkEnemyHealth(currentPos, 2, 3)
        })
    })
    describe("Lightning guild", () => {
        beforeAll(() => {
            register("LIGHTNING", 1)
        })
        test("activation", () => {
            activate()
            checkHighlighted(3)
            const enemy = getEnemyFields(currentPos)[0]
            enemy.select()
            checkHealth(enemy, 3)
            checkHighlighted(0)
            enemy.elemental?.hit(2)
            activate()
            enemy.select()
            checkTeam1Point(1)
            checkEnemyLength(currentPos, 2)
            checkHighlighted(2)
            getEnemyFields(currentPos)[0].select()
            checkHighlighted(0)
        })
    })
    describe("Air guild", () => {
        beforeAll(() => {
            register("AIR", 4)
        })

        test("activation", () => {
            activate()
            getMyLastField(2).select()
            checkFirstEnemyHealth(2, 4)
            checkFirstEnemyHealth(1, 4)
            checkFirstEnemyHealth(3, 4)
        })
    })
    describe("Water guild", () => {
        beforeAll(() => {
            register("WATER", 0)
        })

        test("activation", () => {
            activate()
            checkFirstEnemyHealth(currentPos, 3)
            getMyLastField(1).select()
            checkFirstEnemyHealth(1, 4)
            checkMyLength(1, 5)
        })
    })

    describe("Dark guild", () => {
        beforeAll(() => {
            register("DARK", 4)
        })

        test("activation", () => {
            activate()
            checkHighlighted(4)
            let destination = 3
            getMyLastField(destination).select()
            checkMyLength(destination, 4)
            checkFirstEnemyHealth(destination, 4)
            destination = 2
            getEnemyFirstField(destination).elemental!.hit(4)
            activateField(activatedField)
            checkHighlighted(4)
            getMyLastField(destination).select()
            checkTeam1Point(2)
        })
    })
    describe("Light guild", () => {
        beforeAll(() => {
            register("LIGHT", 3)
        })

        test("activation", () => {
            const selected = getMyFields(0)[0]
            checkHealth(selected, 4)
            activate()
            checkFirstEnemyHealth(currentPos, 3)
            checkHighlighted(18)
            selected.select()
            checkHealth(selected, 5)
        })
    })

    describe("Magnetic guild", () => {
        beforeAll(() => {
            register("MAGNETIC", 1)
        })

        test("activation", () => {
            activate()
            checkHighlighted(2)
            checkEnemyHealth(currentPos, 2, 4)
            const destination = 2
            getMyLastField(destination).select()
            checkMyLength(destination, 4)
            checkEnemyLength(destination, 2)
        })
    })
    describe("Love guild", () => {
        beforeEach(() => {
            register("LOVE", 0)
        })

        test("activation", () => {
            activate()
            checkFirstEnemyHealth(currentPos, 3)
        })
        test("spawn", () => {
            spawn()
            checkHighlighted(3)
            const selected = getMyFields(currentPos)[0]
            checkHealth(selected, 4)
            selected.select()
            checkHealth(selected, 5)
        })
    })

    describe("Music guild", () => {
        beforeAll(() => {
            register("MUSIC", 1)
        })

        test("activation", () => {
            activate()
            checkFirstEnemyHealth(currentPos, 3)
            const enemy = getEnemyFirstField(currentPos)
            activate()
            const spy = jest.spyOn(enemy.elemental!.guild, "spawn")
            activate()
            getMyLastField(currentPos + 1).select()
            checkMyLength(currentPos + 1, 4)
            checkEnemyLength(currentPos, 2)
            expect(spy).toBeCalled()
        })
    })

    describe("Lava guild", () => {
        beforeAll(() => {
            register("LAVA", 2)
        })

        test("activation", () => {
            checkTeam2Point(0)
            activate()
            checkFirstEnemyHealth(currentPos - 1, 3)
            checkFirstEnemyHealth(currentPos + 1, 3)
            const currentRowFields = getMyFields(currentPos)
            checkHealth(currentRowFields[0], 4)
            checkHealth(currentRowFields[1], 4)
            checkHealth(currentRowFields[2], 4)
            activate()
            activate()
            activate()
            checkTeam2Point(0)
            activate()
            checkMyLength(currentPos, 0)
            checkTeam2Point(4)
        })
    })
    describe("Acid guild", () => {
        beforeAll(() => {
            register("ACID", 1)
        })

        test("activation", () => {
            activate()
            checkFirstEnemyHealth(currentPos, 2)
            checkEnemyHealth(currentPos, 1, 4)
            activate()
            checkTeam1Point(0)
        })
    })
    describe("Comet guild", () => {
        beforeAll(() => {
            register("COMET", 2)
        })

        test("activation", () => {
            activate()
            checkFirstEnemyHealth(currentPos, 3)
            const checkHandLength = (value: number) => {
                expect(concreteCards.hand.size).toBe(value)
            }
            checkHandLength(7)
            concreteCards.hand.remove(concreteCards.hand.cards[0])
            checkHandLength(6)
            activate()
            checkHandLength(7)
            checkTeam1Point(0)
        })
    })

    describe("Sand guild", () => {
        beforeAll(() => {
            register("SAND", 4)
        })

        test("activation", () => {
            activate()
            checkHighlighted(4)
            const destination = 1
            getMyLastField(destination).select()
            checkEnemyHealth(destination, 0, 4)
            checkEnemyHealth(destination, 1, 4)
            checkEnemyHealth(destination, 2, 5)
            checkHealth(getMyLastField(destination).prev!, 5)
        })
    })

    // const user1BaseEls = [
    //     getElementalsCode(['ICE', 'FIRE', 'WATER', 'LOVE'], { health: 4 }),
    //     getElementalsCode(['ACID', 'MAGNETIC', 'MUSIC', 'LIGHTNING'], {}),
    //     getElementalsCode(['CRYSTAL', 'COMET', 'LAVA'], {}),
    //     getElementalsCode(['LIGHT', 'FLORA', 'GROUND'], {}),
    //     getElementalsCode(['AIR', 'DARK', 'SAND', 'BEAST'], { health: 4 }),
    // ]

    // const user2BaseEls = [
    //    ['CRYSTAL_5_0_1'],
    //    ['FIRE_5_0_5', 'AIR_5_0_5'],
    //    ['FIRE_5_1_5'],
    //    ['FIRE_5_2_5', 'LAVA_5_0_5', 'COMET_6_0_6'],
    //    ['FIRE_5_3_5', 'FIRE_7_5_7']
    // ]

    describe("Beast guild", () => {
        beforeAll(() => {
            register("BEAST", 4)
        })

        test("activation", () => {
            activate()
            let destination = 3
            checkFirstEnemyHealth(destination, 2)
            const newField = getMyLastField(destination).prev!
            newField.elemental!.healToMax()
            activateField(newField)
            destination = 2
            getMyLastField(destination).select()
            checkFirstEnemyHealth(destination, 3)
        })
    })
})

describe("Killer work test", () => {
    let killer: Killer
    let points: PointsManager
    let cards: Map<User, CardsController>
    let attacker: Field
    let victim: Field

    beforeEach(() => {
        const turn1 = new Turn(teams1, user1)
        cards = new Map<User, CardsController>()

        cards.set(user1, new CardsController())
        cards.set(user2, new CardsController())

        points = new PointsManager(turn1)
        killer = new Killer(cards, points)

        const node = new MapNode(new MediatorStub())
        attacker = node.createNextNode([user1, team1]).fields[0]!
        victim = node.next!.createUpNode([user2, team2]).fields[0]!
        attacker.createElemental(
            new MobData(GuildFactory.getInstance().create("ICE"), 5)
        )
        victim.createElemental(
            new MobData(GuildFactory.getInstance().create("FIRE"), 5)
        )
    })

    test("hit full health elemental", () => {
        expect(victim.elemental?.health).toBe(5)
        killer.hit(attacker, victim, 2)
        expect(points.points.get(team1)).toBe(0)
        expect(victim.elemental?.health).toBe(3)
        expect(cards.get(user2)?.left.size).toBe(0)
    })

    test("kill elemental", () => {
        killer.hit(attacker, victim, 5)
        expect(points.points.get(team1)).toBe(1)
        expect(points.points.get(team2)).toBe(0)
        expect(attacker.parent!.up?.fields[0]).not.toBe(victim)
        expect(cards.get(user2)?.left.size).toBe(1)
        const node = new MapNode(new MediatorStub())
        attacker = node.createNextNode([user1, team1]).fields[0]!
        victim = node.next!.createUpNode([user2, team2]).fields[0]!
        attacker.createElemental(
            new MobData(GuildFactory.getInstance().create("DARK"), 5)
        )
        victim.createElemental(
            new MobData(GuildFactory.getInstance().create("CRYSTAL"), 5)
        )
        killer.hit(attacker, victim, 5)
        expect(points.points.get(team1)).toBe(4)
        expect(points.points.get(team2)).toBe(0)
    })

    test("kill own elemental", () => {
        attacker.next!.createElemental(
            new MobData(GuildFactory.getInstance().create("FIRE"), 5)
        )
        victim = attacker.next!
        expect(points.points.get(team1)).toBe(0)
        killer.hit(attacker, victim, 5)
        expect(points.points.get(team1)).toBe(0)
        expect(points.points.get(team2)).toBe(1)
        expect(cards.get(user1)?.left.size).toBe(1)
    })
})

describe("Points work tests", () => {
    let controller: PointsManager

    beforeEach(() => {
        controller = new PointsManager(new Turn(teams1, user1))
    })

    test("add points", () => {
        controller.addPoint(team1, 1)
        expect(controller.points.get(team1)).toBe(1)
        expect(controller.points.get(team2)).toBe(0)
    })

    test("add points to opposite team", () => {
        controller.addPointToOppositeTeam(team1, 1)
        expect(controller.points.get(team1)).toBe(0)
        expect(controller.points.get(team2)).toBe(1)
    })

    test("finish game when max point is reached", () => {
        controller.addPoint(team1, 13)
        expect(controller.points.get(team1)).toBe(13)
        expect(controller.isEndOfTheGame).toBe(true)
    })
})

class CHatApiStub implements ChatAPI {
    sendChatMessage = jest.fn()
    deleteChatMessage = jest.fn()
    editChatMessage = jest.fn()
    getLastMessage = jest.fn()
    getMessages = jest.fn()
}

describe("Chat work tests", () => {
    let chat: Chat
    let lastMessage: ChatMessage

    beforeEach(() => {
        chat = new Chat(user1, new CHatApiStub())
        chat.addMessage(new ChatMessage("sample", user1))
        lastMessage = chat.messages.at(-1)!
    })

    test("send message", () => {
        chat.sendMessage("message")
        expect(chat.messages.at(-1)?.message).toBe("message")
    })

    test("delete message", () => {
        lastMessage.delete()
        expect(chat.messages.includes(lastMessage)).toBeFalsy
    })

    test("edit message", () => {
        lastMessage.edit("red")
        expect(lastMessage.message).toBe("red")
    })
})

describe("Updaters test", () => {
    describe("GameProcess updater test", () => {
        let updater: GameProcessUpdater
        let process: GameProcess

        beforeEach(() => {
            const teamPoints = new Map<Team, number>()
            teamPoints.set(team1, 0)
            teamPoints.set(team2, 0)
            const userFields = new Map<User, ElementalCode[][]>()
            userFields.set(user1, [[], [], [], [], []])
            userFields.set(user2, [[], [], [], [], []])
            const userDecks = new Map<User, ServerUserDecks>()
            userDecks.set(user1, {
                left: ["AIR_7_5"],
                hand: ["LIGHT_7_5"],
                deck: ["AIR_5_5", "AIR_5_5", "AIR_5_5", "AIR_5_5"],
            })
            userDecks.set(user2, { left: [], hand: [], deck: [] })
            const gameState = new InGameStageController(
                new IStageControllerStub(),
                true
            )
            const turn = new Turn(teams1, user1, user1)
            process = new GameProcess(turn, gameState, true, undefined, {
                points: teamPoints,
                fields: userFields,
                cards: userDecks,
            })
            process.start()
            updater = new GameProcessUpdater(process)
        })

        test("update users cards test", () => {
            let user1Cards = process.getCertainUserDeck(user1)
            expect(user1Cards.left.size).toBe(1)
            expect(user1Cards.hand.size).toBe(1)
            expect(user1Cards.total.size).toBe(4)
            updater.updateUserDecks([
                {
                    id: "1",
                    cards: {
                        left: [],
                        hand: ["AIR_7_5", "LIGHT_7_5", "WATER_5_5", "AIR_5_5"],
                        deck: [
                            "AIR_5_5",
                            "AIR_5_5",
                            "AIR_5_5",
                            "AIR_5_5",
                            "AIR_5_5",
                            "AIR_5_5",
                            "AIR_5_5",
                            "AIR_5_5",
                            "AIR_5_5",
                        ],
                    },
                },
            ])
            user1Cards = process.getCertainUserDeck(user1)
            expect(user1Cards.left.size).toBe(0)
            expect(user1Cards.hand.size).toBe(4)
            expect(user1Cards.total.size).toBe(9)
        })

        test("update teams points", () => {
            expect(process.points.points.get(team1)).toBe(0)
            updater.updateTeamPoints([{ id: "1", points: 1 }])
            expect(process.points.points.get(team1)).toBe(1)
        })

        test("update game field", () => {
            let firstNodeFields = process.gameField.startNode.next!.fields
            expect(firstNodeFields.length).toBe(1)
            updater.updateGameField([
                {
                    id: "1",
                    fields: [["AIR_7_0_5"], [], [], [], []],
                },
            ])
            firstNodeFields = process.gameField.startNode.next!.fields
            expect(firstNodeFields.length).toBe(2)
        })

        test("update all state", () => {
            updater.updateAllState({
                teams: [
                    {
                        id: "1",
                        name: "",
                        points: 1,
                        users: [
                            {
                                id: "1",
                                fields: [["AIR_7_0_5"], [], [], [], []],
                                cards: {
                                    left: [],
                                    hand: [
                                        "AIR_7_5",
                                        "LIGHT_7_5",
                                        "WATER_5_5",
                                        "AIR_5_5",
                                    ],
                                    deck: [
                                        "AIR_5_5",
                                        "AIR_5_5",
                                        "AIR_5_5",
                                        "AIR_5_5",
                                        "AIR_5_5",
                                        "AIR_5_5",
                                        "AIR_5_5",
                                        "AIR_5_5",
                                        "AIR_5_5",
                                    ],
                                },
                            },
                        ],
                    },
                ],
            })
            expect(process.gameField.startNode.next!.fields.length).toBe(2)
            const user1Cards = process.getCertainUserDeck(user1)
            expect(user1Cards.left.size).toBe(0)
            expect(user1Cards.hand.size).toBe(4)
            expect(user1Cards.total.size).toBe(9)
        })
    })

    describe("Draft updater test", () => {
        let updater: DraftUpdater
        let draft: Draft
        beforeEach(() => {
            const turn = new Turn(teams1, user1, user1)
            draft = new Draft(turn, gameStateControllerStub, true)
            draft.start({ guildsPerPlayer: 2 })
            updater = new DraftUpdater(draft)
        })

        test("update guilds pool test", () => {
            expect(draft.guilds.guilds.length).toBe(10)
            updater.updateGuildsPool(["ACID", "DARK"])
            expect(draft.guilds.guilds.length).toBe(2)
        })

        test("update users drafts test", () => {
            expect(draft.usersDraft.get(user1)?.chosen.size).toBe(0)
            updater.updateUserGuilds([
                {
                    id: "1",
                    draft: {
                        picks: ["ACID"],
                        bans: ["WATER", "BEAST"],
                    },
                },
            ])
            expect(draft.usersDraft.get(user1)?.chosen.size).toBe(1)
            expect(draft.usersDraft.get(user1)?.banned.size).toBe(2)
        })

        test("update all state", () => {
            updater.updateAllState({
                guilds: ["ACID", "AIR"],
                teams: [
                    {
                        users: [
                            {
                                id: "1",
                                draft: {
                                    picks: ["DARK", "FIRE", "ICE"],
                                    bans: ["ACID", "BEAST", "COMET"],
                                },
                            },
                        ],
                    },
                ],
            })
            expect(draft.guilds.guilds.length).toBe(2)
            expect(draft.usersDraft.get(user1)?.chosen.size).toBe(3)
            expect(draft.usersDraft.get(user1)?.banned.size).toBe(3)
        })
    })
})

describe("Foolish bot work test", () => {})
