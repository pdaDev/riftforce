import { AuthUser, Team, UserWithReadyStatus, CardsController, Deck, Elemental, FieldsController, GameRoomPropsController, Guild, GuildFactory, GuildsPoolController, MobData,  User, UserDraft } from "./Class";
import { ServerAuthUser, ServerTeam, ServerRoomUserState, ServerUser, ServerUserPicks, ServerRoomState, GuildCode, MobDataCode, ElementalCode, ServerDeckData, ServerUserDecks, ServerGuildsPool } from "./namespace";

export class AuthUserMapper {
    static toEntity() {

    }

    static toDomain({ id, email, name, avatar, rating, isAdmin, activated }: ServerAuthUser) {
        return new AuthUser(id, name, email, avatar, rating, isAdmin, activated)
    }
}

export class RoomTeamMapper {
    static toDomain({ id, name, users }: ServerTeam<ServerRoomUserState>): Team<UserWithReadyStatus>  {
        return new Team(id, users.map(({ ready, ...user}) => new UserWithReadyStatus(UserMapper.toDomain(user), ready)) ,name)
    }

    static toEntity({ id, name, users }: Team<UserWithReadyStatus>): ServerTeam<ServerRoomUserState> {
        return {
            id,
            name: name || '',
            users: users.map(({ id, name, rating, ready, email, avatar }) => ({
                id, name, rating, ready, email, avatar
            }))
        }
    }
}


export class UserMapper {
    static toDomain({ id, name, email, avatar, rating }: ServerUser): User {
        return new User(id, name, email, avatar, rating)
    }
    static toEntity(domain: User): ServerUser {
        return {
            id: domain.id,
            name: domain.name,
            avatar: domain.avatar,
            rating: domain.rating,
            email: domain.email
        }
    }
}

export class UserDraftMapper {
    static toEntity({ chosen, banned }: UserDraft): ServerUserPicks {
        return {
            picks: Array.from(chosen).map(GuildsMapper.toEntity),
            bans: Array.from(banned).map(GuildsMapper.toEntity),
        }
    }

    static toDomain({ picks, bans }: ServerUserPicks): UserDraft {
        const draft = new UserDraft()

        draft.setChosen(GuildFactory.getInstance().createSeveral(picks))
        draft.setBanned(GuildFactory.getInstance().createSeveral(bans))

        return draft
    }
}

export class TeamMapper {
    static toDomain({ id, name, users }: ServerTeam): Team {
        return new Team(id, users.map(UserMapper.toDomain), name)
    }
    static toEntity({ id, name, users }: Team): ServerTeam {
        return {
            id,
            name: name || '',
            users: users.map(UserMapper.toEntity)
        }
    }
}

export class GameRoomPropsMapper {
    static toDomain({ type, password, name, props: { playersCount, withExtension, draftStages } }: Omit<ServerRoomState, 'teams'>): GameRoomPropsController {
        return new GameRoomPropsController({
            playersCount,
            withExtension,
            draftStages,
            type,
            name,
            password
        })
    }

    static toEntity({ password, playersCount, withExtension, draftStages, type }: GameRoomPropsController): Omit<ServerRoomState, 'blackList' |  'creationDate' | 'teams' | 'name'> {
        return {
            password: password.data as string,
            type,
            props: {
                playersCount,
                withExtension,
                draftStages
            }
        }
    }
}

export class GuildsMapper {
    static toDomain(code: GuildCode): Guild {
        return GuildFactory.getInstance().create(code)
    }
    static toEntity(guild: Guild): GuildCode {
        return guild.code
    }
}

export class MobDataMapper {
    static toDomain(code: MobDataCode): MobData {
        const [guild, value, index] = code.split('_')

        return new MobData(GuildsMapper.toDomain(guild as GuildCode), +value, +index)
    }
    static toEntity(mobData: MobData): MobDataCode {
        return mobData.code
    }
}

export class ElementalMapper {
    static toDomain(code: ElementalCode): Elemental {
        return new Elemental(MobDataMapper.toDomain(code as MobDataCode), +code.split('_')[3])
    }
    static toEntity(el: Elemental): ElementalCode {
        return el.code
    }
}

export class DeckMapper {
    static toDomain(serverCards: ServerDeckData) {
        return new Deck(serverCards.map(MobDataMapper.toDomain))

    }

    static toEntity(deck: Deck): ServerDeckData {
        return deck.cards.map(MobDataMapper.toEntity)        
    }
}

export class CardsControllerMapper {
    static toDomain({ hand, deck, left }: ServerUserDecks): CardsController {
        const controller = new CardsController()
        controller.setHandCards(DeckMapper.toDomain(hand))
        controller.setTotalCards(DeckMapper.toDomain(deck))
        controller.setLeftCards(DeckMapper.toDomain(left))

        return controller
    }

    static toEntity({ total, hand, left }: CardsController): ServerUserDecks {
        return {
            left: DeckMapper.toEntity(left),
            hand: hand.cards.map(card => MobDataMapper.toEntity(card.mobData)),
            deck: DeckMapper.toEntity(total)
        } as ServerUserDecks
    }
}

export class GuildsPoolMapper {
    static toDomain(guilds: ServerGuildsPool): GuildsPoolController {
        const pool = new GuildsPoolController()
        pool.setGuilds(GuildFactory.getInstance().createSeveral(guilds))
        return pool
    }

    static toEntity({ guilds }: GuildsPoolController): ServerGuildsPool {
        return guilds.map(card => GuildsMapper.toEntity(card.guild))
    }
}

export class FieldsControllerMapper {
    static toEntity(constroller: FieldsController): Map<User, ElementalCode[][]> {
        const fields = new Map<User, ElementalCode[][]>()

        constroller.iterateThroughAllNodes(node => {
            if (node.user) {
                const user = node.user[0]

                if (!fields.has(user)) {
                    fields.set(user, [])
                }

                const userFields = fields.get(user)!
                userFields.push(node.fields.filter(field => field.elemental).map(field => field.elemental!.code))  
            }
        })

        return fields
    }

    // toDomain(state: ServerTeamUserFields): FieldsController {
    // }
}
