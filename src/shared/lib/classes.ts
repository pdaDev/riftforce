import { action, makeObservable, observable } from 'mobx'
import * as yup from 'yup'

type ValidationFieldData = string | null | number

export class ValidationField  {
    data: ValidationFieldData
    private validator: yup.Schema
    error: string | undefined

    constructor(data: ValidationFieldData, validator: yup.Schema) {
        this.data = data
        this.validator = validator
        makeObservable(this, {
            data: observable,
            setValue: action
        })
    }

    setValue = (data: ValidationFieldData) => {
        this.data = data
        this.validate()
    }

    get isValid() {
        return !this.error
    }

    private validate = () => {
        try {
            this.validator.validateSync(this.data)
            this.error = ''
        } catch (err: any) {
            this.error = err.message
        }
    }
}
