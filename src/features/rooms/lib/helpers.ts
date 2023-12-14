import { DraftStage } from "../../../shared"


export const t = (code: DraftStage) => {
    const stages: Record<DraftStage, string> = {
        'PICK': 'Пик',
        'BAN': 'Бан'
    }
    
    return stages[code]
}