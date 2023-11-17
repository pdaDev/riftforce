
import {AirGuild, BASE_GUILDS_CODE, Card, CardsController, Chat, ChatAPI,
     
     
     Decks,
     
     
     Draft, DraftContentBuilder, Field, GameContentBuilder, GameProcess, GameStageController,
      GameState,
      Guild, GuildCode, GuildFactory, GuildsPoolController, 
      Iterator, Spawn,
      Killer, MapNode, Mediator, Message, MobData, MusicGuild, PointsManager, Team, Turn, User, UserDraft, UserPicks } from './Class'

class MediatorStub implements Mediator {
    notify = jest.fn()
}

const stub = new MediatorStub()

const user1 = new User('1', 'user1', null)
const user2 = new User('2', 'user2', null)
const user3 = new User('3', 'user3', null)
const user4 = new User('4', 'user4', null)

const team1 = new Team('1', [user1])
const team2 = new Team('2', [user2])
const team3 = new Team('1', [user1, user2])
const team4 = new Team('2', [user3, user4])

const teams1 = [team1, team2]
const teams2 = [team1, team4]
const teams3 = [team3, team4]

describe("Node work tests", () => {
    const node = new MapNode(stub, [user1, team1])

    test("Node is creating with not-empty fields", () => {
        expect(node.fields.length).toBe(1)
    })

    test('Node field add new field', () => {
        node.addField()
        expect(node.fields.length).toBe(2)
        expect(node.fields[0].next).toBe(node.fields.at(-1))
        expect(node.fields.at(-1)!.prev).toBe(node.fields[0])
    })

    test('Node field delete', () => {
        const field = node.fields.at(-1)
        field?.delete()
        expect(node.fields.length).toBe(1)
    })

    test('Node chain creation', () => {
        const node = new MapNode(stub)
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
        const node = new MapNode(stub, [user1, team1])
        expect(node.fields.length).toBe(1)
        node.lastField?.createElemental(new MobData(GuildFactory.getInstance().create('AIR'), 5))
        expect(node.fields.length).toBe(2)
        expect(node.lastField?.elemental).toBeNull()
    })
})



describe("Turn work tests", () => {
    test('next function work for 2 players', () => {
        const turn = new Turn(teams1, user1, user1)
        expect(turn.currentTurn).toBe(user1)
        turn.next()
        expect(turn.currentTurn).toBe(user2)
        turn.next()
        expect(turn.currentTurn).toBe(user1)
    })

    test('next function work for 3 players', () => {
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

    test('next function work for 4 players', () => {
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
        const groups  = turn1.groupedTeamsInRightOrder

        expect(groups[0][0][0]).toBe(user1)
        expect(groups[0][1][0]).toBe(user2)
        expect(groups[1][0][0]).toBe(user4)
        expect(groups[1][1][0]).toBe(user3)

        const turn2 = new Turn(teams3, user3)
        const groups2  = turn2.groupedTeamsInRightOrder

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
        const groups4  = turn4.groupedTeamsInRightOrder

        expect(groups4[0][0][0]).toBe(user2)
        expect(groups4[0][1][0]).toBe(user1)
        expect(groups4[1][0][0]).toBe(user3)
        expect(groups4[1][1][0]).toBe(user4)
    })

    test("random first turn" , () => {
        const turn = new Turn(teams3, user1)
        expect(turn.currentTurn).toBeDefined()
    })
})


describe("GuildsPoolController work tests", () => {
    let controller: GuildsPoolController

    beforeEach(() => {
        controller = new GuildsPoolController()
        controller.setGuilds(GuildFactory.getInstance().createSeveral(BASE_GUILDS_CODE as any))
    })

    test("highlight guilds card", () => {
        controller.highlightGuilds(true)
        controller.guilds.forEach(card => expect(card.highlighted).toBeTruthy())
    })

    test("reset highlights", () => {
        controller.reset()
        controller.guilds.forEach(card => expect(card.highlighted).toBeFalsy())
    })

    test("again highlights", () => {
        controller.highlightGuilds(true)
        controller.guilds.forEach(card => expect(card.highlighted).toBeTruthy())
    } )

    test('when take random guild, all guilds pool will be decreased', () => {
        const initGuildsLength = controller.guilds.length
        controller.takeRandomGuildSync()
        expect(controller.guilds.length).toBe(initGuildsLength - 1)
    })

    test('when take guild in async mode, all guilds pool will be decreased', () => {
        const initGuildsLength = controller.guilds.length
        controller.takeRandomGuildAsync()
        controller.guilds[0].select()
        expect(controller.guilds.length).toBe(initGuildsLength - 1)
    })

    test("take random guild returns Guild instance", () => {
        expect(controller.takeRandomGuildSync()).toBeInstanceOf(Guild)
    })

    test("take random async guild intercept get guild request", () => {
        controller.getGuildAsync().then(guild => expect(guild).toBeDefined())
        controller.takeRandomGuildAsync()
    })
})

class GameStateControllerStub implements GameStageController {
    setGameStage() {
        // console.log(stage, preloading)
    }

    syncState() {

    }

    stopLoading(){

    }

    startLoading() {

    }
}

describe("GuildsFactory work test", () => {
    test("created guild has code", () => {
        const code: GuildCode = 'ACID'
        const guild = GuildFactory.getInstance().create(code)
        expect(guild.code).toBe(code)
    })

    test("factory create just one instance of guild", () => {
        const code: GuildCode = 'ACID'
        const first = GuildFactory.getInstance().create(code)
        const second = GuildFactory.getInstance().create(code)
        expect(first).toBe(second)
    })
})

describe("Draft stage test work", () => {
    let draft: Draft

    beforeEach(() => {
        const turn = new Turn(teams1, user1, user1)
        draft = new Draft(turn, new GameStateControllerStub(), {
            guildsPerPlayer: 1,
        })
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    test('draft stopped when users drafts are full', () => {
        draft.usersDraft.get(user1)!.choose(draft.guilds.takeRandomGuildSync())
        draft.usersDraft.get(user2)!.choose(draft.guilds.takeRandomGuildSync())
        expect(draft.isEnd()).toBe(true)
    })

    test("turn go to next when user select guild from guild pool",async () => {
        expect(draft.isEnd()).toBeFalsy()
        expect(draft.turn.currentTurn).toBe(user1) 
        expect(draft.currentStage).toBe('pick')
        draft.processIterate().then(() => {
            expect(draft.turn.currentTurn).toBe(user2)
            expect(draft.getDraftByUser(user1).chosen.size).toBe(1)
        })
        draft.guilds.takeRandomGuildAsync()
    })

    test("is enforced stopped", () => {
        draft.start()
        draft.pause()
        expect(draft.isEnd()).toBeTruthy()
    })

    test("set next stage", () => {
        draft = new Draft(new Turn(teams1, user1, user1), new GameStateControllerStub(), {
            guildsPerPlayer: 2,
            draftTemplates: ['pick', 'ban'] 
        })
        expect(draft.turn.currentTurn).toBe(user1)
        draft.processIterate().then(() => {
            expect(draft.currentStage).toBe('pick')

            draft.processIterate().then(() => {
                expect(draft.currentStage).toBe('ban')

                draft.processIterate().then(() => {
                    draft.processIterate().then(() => {
                        expect(draft.currentStage).toBe('pick')
                    })
                    draft.guilds.takeRandomGuildAsync()
                })
                draft.guilds.takeRandomGuildAsync()
            })
            draft.guilds.takeRandomGuildAsync()
        })
    })

    test("random set drafts", () => {
        const draftsCount = 2
        draft = new Draft(new Turn(teams1, user1, user1), new GameStateControllerStub(), {
            guildsPerPlayer: draftsCount,
        })
        draft.setRandomDrafts()
        expect(draft.isEnd()).toBeTruthy()
        expect(draft.getDraftByUser(user1).chosen.size).toBe(draftsCount)
        expect(draft.getDraftByUser(user2).chosen.size).toBe(draftsCount)
    })
})

describe("UserDraft work test", () => {
    let draft: UserDraft

    beforeEach(() => {
        draft = new UserDraft(2)
    })

    test("choose guild", () => {
        draft.choose(GuildFactory.getInstance().create('AIR'))
        expect(draft.chosen.size).toBe(1)
    })

    test("ban guild", () => {
        draft.ban(GuildFactory.getInstance().create('AIR'))
        expect(draft.banned.size).toBe(1)
    })

    test("choose guild when guilds is full", () => {
        draft.choose(GuildFactory.getInstance().create('AIR'))
        draft.choose(GuildFactory.getInstance().create('ACID'))
        expect(draft.isDraftFull).toBeTruthy()
        draft.choose(GuildFactory.getInstance().create('WATER'))
        expect(draft.chosen.size).toBe(2)
    })
})

describe("DraftContentBuilder work tests", () => {
    test('guilds pool for different count of players in base case', () => {
        const turn1 = new Turn(teams1, user1)
        const turn2 = new Turn(teams2, user1)
        const turn3 = new Turn(teams3, user1)
        const poolSize1 = new DraftContentBuilder(turn1).formatGuildsPool(false, false).guilds.guilds.length
        const poolSize2 = new DraftContentBuilder(turn2).formatGuildsPool(false, false).guilds.guilds.length
        const poolSize3 = new DraftContentBuilder(turn3).formatGuildsPool(false, false).guilds.guilds.length
        expect(poolSize1).toBe(10)
        expect(poolSize2).toBe(12)
        expect(poolSize3).toBe(14)
    })

    test('guilds pool with ban and without', () => {
        const turn1 = new Turn(teams1, user1)
        const poolSize1 = new DraftContentBuilder(turn1).formatGuildsPool(true, false).guilds.guilds.length
        const poolSize2 = new DraftContentBuilder(turn1).formatGuildsPool(false, false).guilds.guilds.length
        expect(poolSize1).toBe(18)
        expect(poolSize2).toBe(10)
    })

    test('guilds pool with extension and without', () => {
        const turn1 = new Turn(teams1, user1)
        const poolSize1 = new DraftContentBuilder(turn1).formatGuildsPool(true, true).guilds.guilds.length
        const poolSize2 = new DraftContentBuilder(turn1).formatGuildsPool(false, false).guilds.guilds.length
        expect(poolSize1).toBe(18)
        expect(poolSize2).toBe(10)
    })

    test('init guilds draft with first random guild', () => {
        const turn1 = new Turn(teams1, user1)
        const builder = new DraftContentBuilder(turn1)
            .formatGuildsPool(false, false)
            .setMaxCountOfGuildsPerUser(4)
            .addUsersRandomGuild()

        for (let draft of builder.usersDraft.values()) {
            expect(draft.chosen.size).toBe(1)
        }
        expect(builder.guilds.guilds.length).toBe(8)
    })

    test('count of guilds must be in borders of guilds pool', () => {
        const turn1 = new Turn(teams2, user1)
        const builder = new DraftContentBuilder(turn1)
            .formatGuildsPool(true, true)
            .setMaxCountOfGuildsPerUser(10)

        expect(builder.usersDraft.get(user1)?.maxChosenCount).toBe(8)
        expect(builder.usersDraft.get(user3)?.maxChosenCount).toBe(4)
        expect(builder.usersDraft.get(user4)?.maxChosenCount).toBe(4)

        const turn2 = new Turn(teams1, user1)
        const builder2 = new DraftContentBuilder(turn2)
            .formatGuildsPool(false, false)
            .setMaxCountOfGuildsPerUser()

        expect(builder2.usersDraft.get(user1)?.maxChosenCount).toBe(5)
        expect(builder2.usersDraft.get(user2)?.maxChosenCount).toBe(5)

        const builder3 = new DraftContentBuilder(turn2)
            .formatGuildsPool(false, false)
            .addUsersRandomGuild(1)
            .setMaxCountOfGuildsPerUser()
      

        expect(builder3.usersDraft.get(user1)?.maxChosenCount).toBe(4)
        expect(builder3.usersDraft.get(user2)?.maxChosenCount).toBe(4)
       
    })

    test('check draft stages template availability', () => {
        const turn1 = new Turn(teams1, user1)
        const builder = new DraftContentBuilder(turn1)
            .formatGuildsPool(true, true)
        expect(builder.guilds.guilds.length).toBe(18)
        expect(builder.checkDraftTemplate([])).toBe(false)
        expect(builder.checkDraftTemplate(['pick'])).toBe(true)
        expect(builder.checkDraftTemplate(['ban'])).toBe(false)
        expect(builder.checkDraftTemplate(['pick', 'ban'])).toBe(true)
        expect(builder.checkDraftTemplate(['pick', 'ban', 'ban'])).toBe(true)
        expect(builder.checkDraftTemplate(['pick', 'ban', 'ban'], 4)).toBe(false)
        expect(builder.checkDraftTemplate(['pick', 'ban', 'ban', 'ban', 'ban', 'ban', 'ban', 'ban', 'ban', 'ban'])).toBe(false)
        expect(builder.checkDraftTemplate(['pick', 'ban', 'pick', 'ban', 'pick', 'ban', 'ban', 'pick'])).toBe(true)
    })

    test("parse guilds pool", () => {
        const turn1 = new Turn(teams1, user1)
        const builder = new DraftContentBuilder(turn1)
            .parseGuildsPool(['AIR', 'MUSIC'])
        expect(builder.guilds.guilds.length).toBe(2)
        expect(builder.guilds.guilds[0].guild).toBeInstanceOf(AirGuild)
        expect(builder.guilds.guilds[1].guild).toBeInstanceOf(MusicGuild)
    })  

    test('parse guilds draft', () => {
        const turn1 = new Turn(teams1, user1)
        const userDrafts = new Map<User, UserPicks>()
        userDrafts.set(user1, {
            picks: ['AIR'],
            bans: ['ACID']
        })
        userDrafts.set(user2, {
            picks: ['LAVA', 'LIGHT'],
            bans: []
        })
        const builder = new DraftContentBuilder(turn1)
            .parseUserDrafts(userDrafts).usersDraft
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
            const gameField = new GameContentBuilder(turn).createGameField().gameField
            
            expect(gameField.startNode).toBeDefined()
            expect(gameField.startNode.next).toBeTruthy()
            expect(gameField.startNode!.next!.user![0]).toBe(user1)
            expect(gameField.startNode!.next!.up!.user![0]).toBe(user2)
            expect(gameField.startNode!.next!.next!.user![0]).toBe(user1)
            expect(gameField.startNode!.next!.next!.up!.user![0]).toBe(user2)
            expect(gameField.startNode.fields.length).toBe(0)
            expect(gameField.startNode.next?.fields.length).toBe(1)
            expect(gameField.startNode.next!.next!.next!.next!.next!.next?.user).toBeFalsy()
      

            gameField.iterateThroughAllNodes(node => {
                if (node.user) {
                    countOfNodesByUser.set(node.user[0],  (countOfNodesByUser.get(node.user[0]) || 0) + 1)
                }
            })

            gameField.iterateThroughMyNodes(node => {
                expect(node.up).toBeDefined()
            })

            expect(countOfNodesByUser.get(user1)).toBe(5)
            expect(countOfNodesByUser.get(user2)).toBe(5)
        })

        test("game field for 3 players", () => {
            const turn = new Turn(teams2, user1)
            const countOfNodesByUser: Map<User, number> = new Map()
            const gameField = new GameContentBuilder(turn).createGameField().gameField
    
            gameField.iterateThroughAllNodes(node => {
                if (node.user) {
                    countOfNodesByUser.set(node.user[0],  (countOfNodesByUser.get(node.user[0]) || 0) + 1)
                }
            })

            gameField.iterateThroughMyNodes(node => {
                expect(node.up).toBeDefined()
            })

            expect(countOfNodesByUser.get(user1)).toBe(6)
            expect(countOfNodesByUser.get(user3)).toBe(3)
            expect(countOfNodesByUser.get(user4)).toBe(3)
        })

        test("game field for 4 players", () => {
            const turn = new Turn(teams3, user1)
            const countOfNodesByUser: Map<User, number> = new Map()
            const gameField = new GameContentBuilder(turn).createGameField().gameField
    
            gameField.iterateThroughAllNodes(node => {
                if (node.user) {
                    countOfNodesByUser.set(node.user[0],  (countOfNodesByUser.get(node.user[0]) || 0) + 1)
                }
            })

            gameField.iterateThroughMyNodes(node => {
                expect(node.up).toBeDefined()
            })

            expect(countOfNodesByUser.get(user1)).toBe(3)
            expect(countOfNodesByUser.get(user2)).toBe(3)
            expect(countOfNodesByUser.get(user3)).toBe(3)
            expect(countOfNodesByUser.get(user4)).toBe(3)
        })
    })
   
    test("create game field with fields", () => {
        const turn = new Turn(teams1, user1)
        const usersFields: Map<User, string[][]> = new Map()
        usersFields.set(user1, [[],[],[],[],[]])
        usersFields.set(user2, [[],[],[],[],['AIR_5_4']])
        const gameField = new GameContentBuilder(turn).createGameField(usersFields).gameField
        const secondUserFields = gameField.startNode.prev!.fields
        expect(secondUserFields.length).toBe(2)
        const firstUserElemental = secondUserFields[0].elemental!
        expect(firstUserElemental.guild.code).toBe('AIR')
        expect(firstUserElemental.maxHealth).toBe(5)
        expect(firstUserElemental.health).toBe(4)
    })

    test("parse gameFields", () => {
        const turn = new Turn(teams1, user1)
        const usersFields: Map<User, string[][]> = new Map()
        usersFields.set(user1, [[]])
        usersFields.set(user2, [[],[],[],[],['AIR_5_4']])
        const gameField = new GameContentBuilder(turn).createGameField().parseUserFields(usersFields).gameField
        const secondUserFields = gameField.startNode.prev!.fields
        expect(secondUserFields.length).toBe(2)
        const firstUserElemental = secondUserFields[0].elemental!
        expect(firstUserElemental.guild.code).toBe('AIR')
        expect(firstUserElemental.maxHealth).toBe(5)
        expect(firstUserElemental.health).toBe(4)
    })

    test('parse game deck', () => {
        const turn = new Turn(teams1, user1)
        const decks = new Map<User, Decks>()
        decks.set(user1, {
            hand: [],
            left: [],
            deck: []
        })
        decks.set(user2, {
            hand: ['AIR_7', 'AIR_5'],
            left: ['ICE_5'],
            deck: ['FIRE_6']
        })

        const cards = new GameContentBuilder(turn).parseUserDecks(decks).userCards
        const secondUserDecks = cards.get(user2)!
        expect(secondUserDecks?.leftCardsDeck.size).toBe(1)
        expect(secondUserDecks?.handCardDeck.size).toBe(2)
        expect(secondUserDecks?.leftCardsDeck.size).toBe(1)
        const firstCardInDeck = secondUserDecks.handCardDeck.cards[0].mobData
        expect(firstCardInDeck.guild.code).toBe('AIR')
        expect(firstCardInDeck.value).toBe(7)
        expect(secondUserDecks.handCardDeck.cards[0]).toBeInstanceOf(Card)
    })

    test('format init users decks', () => {
        const usersDrafts = new Map<User, UserDraft>()
        const draft1 = new UserDraft()
        GuildFactory.getInstance().createSeveral(['ACID', 'AIR', 'BEAST', 'COMET']).forEach(guild => {
            draft1.choose(guild)
        })
        const draft2 = new UserDraft()
        usersDrafts.set(user1, draft1)
        usersDrafts.set(user2, draft2)
        const turn = new Turn(teams1, user1)
        const cards = new GameContentBuilder(turn).formatInitDecks(usersDrafts).userCards
        const user1Cards = cards.get(user1)!
        expect(user1Cards.cardsDeck.size).toBe(29)
        expect(user1Cards.handCardDeck.size).toBe(7)
    })

    test('add random card to center', () => {
        const turn = new Turn(teams1, user1)
        const usersDrafts = new Map<User, UserDraft>()
        const draft1 = new UserDraft()
        GuildFactory.getInstance().createSeveral(['ACID', 'AIR', 'BEAST', 'COMET']).forEach(guild => {
            draft1.choose(guild)
        })
        const draft2 = new UserDraft()
        GuildFactory.getInstance().createSeveral(['WATER', 'LIGHT', 'DARK', 'MUSIC']).forEach(guild => {
            draft2.choose(guild)
        })
        usersDrafts.set(user1, draft1)
        usersDrafts.set(user2, draft2)
        const field = new GameContentBuilder(turn).createGameField().formatInitDecks(usersDrafts).addCardToCenter().gameField
        const centerFields = field.startNode.next!.next!.next!.fields
        expect(centerFields.length).toBe(2)
        expect(centerFields[0].elemental).toBeTruthy()
    })
})

describe("Game field controller tests", () => {
    test("get concrete field", () => {
        const turn = new Turn(teams1, user1)
        const usersFields: Map<User, string[][]> = new Map()
        usersFields.set(user1, [[]])
        usersFields.set(user2, [['AIR_5_4']])
        const gameField = new GameContentBuilder(turn).createGameField().parseUserFields(usersFields).gameField
        const found = gameField.getConcreteFieldSync('AIR_5_4')
        expect(found).toBeDefined()
        expect(found).toBe
    })
    test("iterate through my nodes", () => {
        const turn = new Turn(teams1, user1, user1)
        let countOfIterations = 0
        const gameField = new GameContentBuilder(turn).createGameField().gameField
        gameField.iterateThroughMyNodes(() => {
            countOfIterations++
        })

        expect(countOfIterations).toBe(5)
    })
})

describe("Iterator work test", () => {
    const nodes = new MapNode(stub)
    const lastNodeInLine = nodes.createNextNode([user1, team1], 1).createNextNode([user1, team1], 2).createNextNode(undefined, 3)
    const last = lastNodeInLine.createNextNode([user1, team1], 4).createNextNode([user1, team1], 5).createNextNode([user1, team1], 6)
    nodes.prev = last
    last.next = nodes
    const iterator = new Iterator()
 

    test('iterate through line', () => {
        let countOfIterations = 0
        const finish = iterator.iterateThroughLine(nodes.next!, _ => countOfIterations++)
        expect(countOfIterations).toBe(2)
        expect(finish).toBe(lastNodeInLine.prev!)
        const finish2 = iterator.iterateThroughLine(lastNodeInLine.next!, _ => {}, nodes)
        expect(finish2.index).toBe(0)
    })

    test('iterate through around', () => {
        let countOfIterations = 0
        iterator.iterateThroughRound(nodes.next!, _ => countOfIterations++)
        expect(countOfIterations).toBe(7)
    })
})

// describe("Guild work test", () => {
//     describe('Ice guild', () => {
//         test("activation", () => {

//         })
//     })
//     describe('Fire guild', () => {
//         test("activation", () => {
            
//         })
//     })
//     describe('Flora guild', () => {
//         test("activation", () => {
            
//         })
//     })
//     describe('Lightning guild', () => {
//         test("activation", () => {
            
//         })
//     })
//     describe('Air guild', () => {
//         test("activation", () => {
            
//         })
//     })
//     describe('Water guild', () => {
//         test("activation", () => {
            
//         })
//     })
//     describe('Crystal guild', () => {
//         test("activation", () => {
            
//         })
//     })
//     describe('Dark guild', () => {
//         test("activation", () => {
            
//         })
//     })
//     describe('Ground guild', () => {
//         test("activation", () => {
            
//         })
//         test("spawn", () => {

//         })
//     })
//     describe('Light guild', () => {
//         test("activation", () => {
            
//         })
//     })
//     describe('Magnetic guild', () => {
//         test("activation", () => {
            
//         })
//     })
//     describe('Love guild', () => {
//         test("activation", () => {
            
//         })
//         test("spawn", () => {

//         })
//     })
//     describe('Music guild', () => {
//         test("activation", () => {
            
//         })
//     })
//     describe('Lava guild', () => {
//         test("activation", () => {
            
//         })
//     })
//     describe('Acid guild', () => {
//         test("activation", () => {
            
//         })
//     })
//     describe('Comet guild', () => {
//         test("activation", () => {
            
//         })
//     })
//     describe('Sand guild', () => {
//         test("activation", () => {
            
//         })
//     })
//     describe('Beast guild', () => {
//         test("activation", () => {
            
//         })
//     })
// })

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
        attacker.createElemental(new MobData(GuildFactory.getInstance().create('ICE'), 5))
        victim.createElemental(new MobData(GuildFactory.getInstance().create('FIRE'), 5))
    })

    test ("hit full health elemental", () => {
        expect(victim.elemental?.health).toBe(5)
        killer.hit(attacker, victim, 2)
        expect(points.points.get(team1)).toBe(0)
        expect(victim.elemental?.health).toBe(3)
        expect(cards.get(user2)?.leftCardsDeck.size).toBe(0)
    })

    test("kill elemental", () => {
        killer.hit(attacker, victim, 5)
        expect(points.points.get(team1)).toBe(1)
        expect(points.points.get(team2)).toBe(0)
        expect(attacker.parent!.up?.fields[0]).not.toBe(victim)
        expect(cards.get(user2)?.leftCardsDeck.size).toBe(1)
        const node = new MapNode(new MediatorStub())
        attacker = node.createNextNode([user1, team1]).fields[0]!
        victim = node.next!.createUpNode([user2, team2]).fields[0]!
        attacker.createElemental(new MobData(GuildFactory.getInstance().create('DARK'), 5))
        victim.createElemental(new MobData(GuildFactory.getInstance().create('CRYSTAL'), 5))
        killer.hit(attacker, victim, 5)
        expect(points.points.get(team1)).toBe(4)
        expect(points.points.get(team2)).toBe(0)
    })

    test("kill own elemental",() => {
        attacker.next!.createElemental(new MobData(GuildFactory.getInstance().create('FIRE'), 5))
        victim = attacker.next!
        expect(points.points.get(team1)).toBe(0)
        killer.hit(attacker, victim, 5)
        expect(points.points.get(team1)).toBe(0)
        expect(points.points.get(team2)).toBe(1)
        expect(cards.get(user1)?.leftCardsDeck.size).toBe(1)
    })
})

describe("Points work tests", () => {
    let controller: PointsManager

    beforeEach(() => {
        controller = new PointsManager(new Turn(teams1, user1))
    })

    test('add points', () => {
        controller.addPoint(team1, 1)
        expect(controller.points.get(team1)).toBe(1)
        expect(controller.points.get(team2)).toBe(0)
    })

    test('add points to opposite team', () => {
        controller.addPointToOppositeTeam(team1, 1)
        expect(controller.points.get(team1)).toBe(0)
        expect(controller.points.get(team2)).toBe(1)
    })

    test('finish game when max point is reached', () => {
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

describe('Chat work tests', () => {
    let chat: Chat
    let lastMessage: Message

    beforeEach(() => {
        chat = new Chat(new CHatApiStub())
        chat.addMessage(new Message('sample'))
        lastMessage = chat.messages.at(-1)!
    })

    test("send message", () => {
        chat.sendMessage('message')
        expect(chat.messages.at(-1)?.data).toBe('message')
    })

    test("delete message", () => {
        lastMessage.delete()
        expect(chat.messages.includes(lastMessage)).toBeFalsy
    })

    test("edit message", () => {
        lastMessage.edit('red')
        expect(lastMessage.data).toBe('red')
    })
})

describe('Cards controller work test', () => {
    let cards: CardsController
    beforeEach(() => {
        const usersDrafts = new Map<User, UserDraft>()
        const draft1 = new UserDraft()
        GuildFactory.getInstance().createSeveral(['ACID', 'AIR', 'BEAST', 'COMET']).forEach(guild => {
            draft1.choose(guild)
        })
        const draft2 = new UserDraft()
        usersDrafts.set(user1, draft1)
        usersDrafts.set(user2, draft2)
        const turn = new Turn(teams1, user1)
        cards = new GameContentBuilder(turn).formatInitDecks(usersDrafts).userCards.get(user1)!
    })
    test("highlight all cards for command", () => {
        cards.setEnabled(true)
        cards.highlightHand(true)
        cards.handCardDeck.cards.forEach(card => {
            expect(card.highlighted).toBeTruthy()
        })
    })

    test("set enabled work test" ,() => {
        cards.setEnabled(true)
        expect(cards.enabled).toBeTruthy()
    })


    test("move cards left" ,() => {
        cards.moveCardFromHandToLeft(cards.handCardDeck.cards[0]!.mobData)
        expect(cards.leftCardsDeck.size).toBe(1)
        expect(cards.handCardDeck.size).toBe(6)
    })

    test("replenish hand deck", () => {
        cards.moveCardFromHandToLeft(cards.handCardDeck.cards[0]!.mobData)
        expect(cards.leftCardsDeck.size).toBe(1)
        expect(cards.handCardDeck.size).toBe(6)
        cards.replenishHandDeck()
        expect(cards.handCardDeck.size).toBe(7)
        expect(cards.cardsDeck.size).toBe(28)
    })
})

describe("Game process work test", () => {
    let process: GameProcess
    beforeEach(() => {
        const usersDrafts = new Map<User, UserDraft>()
        const draft1 = new UserDraft()
        const draft2 = new UserDraft()
        
        GuildFactory.getInstance().createSeveral(['ACID', 'AIR', 'BEAST', 'COMET']).forEach(guild => {
            draft1.choose(guild)
        })
        GuildFactory.getInstance().createSeveral(['FIRE', 'WATER', 'DARK', 'BEAST']).forEach(guild => {
            draft2.choose(guild)
        })
        
        usersDrafts.set(user1, draft1)
        usersDrafts.set(user2, draft2)
        
        const teams = [team1, team2]
        const turn = new Turn(teams)
        
        const gameState = new GameState(teams)
        process = new GameProcess(turn, gameState, usersDrafts)
        process.start()
    })

    test("start highlight hand" ,() => {
        expect(process.turn.isMyTurn).toBe(true)
        expect(process.currentDeck().enabled).toBe(true)
        process.stop()
    })

    test("stop process work", () => {
        process.start()
        expect(process.isEnd()).toBe(false)
        process.stop()
        expect(process.isEnd()).toBe(true)
    })

    test("interact with cards", () => {
        process.interactWithCard().then(() => {
            expect(1).toBe(1)
        })
        process.currentDeck().makeDraw()

    })
})

describe("Game strategy work test", () => {
    let process: GameProcess

    beforeEach(() => {
        
        const teams = [team1, team2]
        const userFields = new Map<User, string[][]>()
        userFields.set(user1, [
            ['AIR_5_5'],['AIR_5_5'],['AIR_5_5'],['AIR_5_5'],[]
        ])
        userFields.set(user2, [
            [], [], [], [], []
        ])
        const userDecks = new Map<User, Decks>()
        userDecks.set(user1, {
            left: [],
            hand: ['AIR_5_5', 'AIR_5_5', 'AIR_5_5', 'AIR_5_5'],
            deck: ['AIR_5_5','AIR_5_5','AIR_5_5','AIR_5_5','AIR_5_5','AIR_5_5','AIR_5_5','AIR_5_5','AIR_5_5']
        })
        userDecks.set(user2, {
            left: [],
            hand: [],
            deck: []
        })
        const turn = new Turn(teams, user1, user1)
        
        const gameState = new GameState(teams)
        process = new GameProcess(turn, gameState)
        const builder = new GameContentBuilder(turn)
            .createGameField(userFields)
            .parseUserDecks(userDecks)
        process.gameField = builder.gameField
        process.usersCards = builder.userCards
        // process.start()
    })

    afterEach(() => {
        process.stop()
    })
        
    describe("Activation strategy tests", () => {
        // process.setActivation(new MobData())
    })
    test("Draw strategy tests", () => {
        process?.setDraw()
        process.action.start()
        expect(process.points.points.get(team1)).toBe(4)
        const decks = process.usersCards.get(user1)!
        expect(decks.handCardDeck.size).toBe(7)
        expect(decks.cardsDeck.size).toBe(6)
     
    })
    test("Spawn strategy tests", () => {
        process.setSpawn(new MobData(GuildFactory.getInstance().create('ACID'), 6))
        // pro
        process.currentDeck().handCardDeck.cards[0].summon() 
    })
})


