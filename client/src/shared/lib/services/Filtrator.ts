interface IFilterProps {
    key: string
    label: string
}

interface IOption {
    value: string
    label: string
}

interface IFilterOption extends IOption {
    selected: boolean
}

interface IOptionsFilterProps extends IFilterProps {
    options: IOption[]
}

interface ISingleValueProps extends IOptionsFilterProps {}

interface IMultipleValueProps extends IOptionsFilterProps {}

type ValueFilterFormat = 'input' | 'slider'

interface ISliderConfig {
    step?: number
    min?: number
    max?: number
}

interface IInputValueFilterProps extends IFilterProps {
    defaultValue?: string | number
    format?: ValueFilterFormat
    sliderConfig?:  ISliderConfig
}

type Mark = { value: number, label: string }

type LeftBrake = '(' | '['
type RightBrake = ')' | ']'
type IntervalBrakes = `${LeftBrake}${RightBrake}`
interface IRangeFilterProps extends IFilterProps {
    defaultMinValue?: number
    defaultMaxValue?: number
    step?: number
    max: number
    min?: number
    minDistance?: number
    measure?: string
    units?: string[]
    intervalBrakes?: IntervalBrakes
    marks?: Mark[]
    calculateValue?: (value: number) => number
    valueLabelFormat?:  (value: number) => string
}

interface IBooleanFilter extends IFilterProps {
    defaultValue?: boolean
}

export class FilterController {
    filters: Filter[] = []

    constructor() {

    }

    withSingleValueFilter(props: ISingleValueProps) {
        this.filters.push(new SingleValueFilter(props))
        return this
    }

    withMultipleValueFilter(props: IMultipleValueProps) {
        this.filters.push(new MultipleValueFilter(props))
        return this
    }

    withRangeFilter(props: IRangeFilterProps) {
        this.filters.push(new RangeFilter(props))
        return this
    }

    withInputValueFilter(props: IInputValueFilterProps) {
        this.filters.push(new InputValueFilter(props))
        return this
    }

    withBooleanFilter(props: IBooleanFilter) {
        this.filters.push(new BooleanFilter(props))
    }

    getConcreteFilter = (key: string) => {
        return this.filters.find(filter => filter.key === key) || null
    }

    reset = () => {
        this.filters.forEach(filter => filter.reset())
    }

    get data () {
        return this.filters.reduce((acc, filter) => {
            acc = {...acc, ...filter.current}
            return acc
        }, {})
    }
}


export enum FilterType {
    single = 'SINGLE',
    multiple = 'MULTIPLE',
    input = 'INPUT-VALUE',
    range = 'RANGE',
    boolean = 'BOOLEAN'
}


abstract class Filter<D = unknown> {
    key: string 
    label: string
    type: FilterType

    constructor({ key, label }: IFilterProps) {
        this.key = key
        this.label = label
        this.type = FilterType.input
    }

    abstract reset(): void
    abstract onChange(props: D): void
    abstract get current(): any
}

abstract class OptionsFilter extends Filter {
    options: IFilterOption[] = []

    constructor({ options, ...props }: IOptionsFilterProps) {
        super(props)
        this.options = options.map(o => ({ ...o, selected: false }))
    }

    reset = () => {
        this.options = this.options.map(o => o.selected ? {...o, selected: false} : o)
    }
} 

export class SingleValueFilter extends OptionsFilter {
    type = FilterType.single
   
    onChange = (key: string) => {
        this.options = this.options.map((o) => o.value === key
            ? { ...o, selected: !o.selected  }
            : o.selected
                ? { ...o, selected: false }
                : o
            )   
    }

    get current () {
        return {
            [this.key]: this.options.find(o => o.selected) || null
        }
    }

}

export class InputValueFilter extends Filter{
    value: null | string | number
    defaultValue: string | number | null
    format: ValueFilterFormat
    sliderConf: ISliderConfig
    type = FilterType.input

    constructor ({ format, sliderConfig, defaultValue, ...props }: IInputValueFilterProps) {
        super(props)
        this.format = format || 'slider'
        this.sliderConf = this.format === 'slider' ? sliderConfig || {} : {}

        if (defaultValue) {
            this.value = defaultValue
            this.defaultValue = defaultValue
        } else {
            this.value = null
            this.defaultValue = null
        }
    }

    onChange =  (value: string | number) => {
        this.value = value
    }

    get current(): any {
        return { 
            [this.key]: this.value
        }
    }

    reset = () => {
        this.value = this.defaultValue
    }
}

export class MultipleValueFilter extends OptionsFilter  {
    type: FilterType = FilterType.multiple

    onChange = (key: string) => {
        this.options = this.options.map(o => o.value === key ? {...o, selected: !o.selected } : o)
    }

    get current () {
        return {
            [this.key]: this.options.filter(o => o.selected)
        }
    }
}

export class RangeFilter extends Filter {
    type: FilterType  = FilterType.range
    value: number[]
    defaultMinValue: number
    defaultMaxValue: number
    step?: number
    max: number
    min: number
    private minDistance?: number
    private measure?: string
    marks: Mark[]
    calculateValue?: (value: number) => number
    valueLabelFormat?:  (value: number) => string

    constructor ({ calculateValue, valueLabelFormat, max, marks, measure, min, minDistance, defaultMaxValue, defaultMinValue, intervalBrakes, ...props }: IRangeFilterProps) {
        super(props)
        this.calculateValue = calculateValue
        this.valueLabelFormat = valueLabelFormat
        this.min = min || 0
        this.max = max 
        this.defaultMinValue = defaultMinValue || this.min
        this.defaultMaxValue = defaultMaxValue || this.max
        this.measure = measure
        this.minDistance = minDistance
        this.marks = marks ||  [{value: this.min, label: this.min.toString() }, { value: this.max, label: `${this.max} ${this.measure || ''}` }]
        this.value = [this.defaultMinValue, this.defaultMaxValue]
    }

    onChange = ({ newValue, activeThumb }:{
        newValue: number[], activeThumb: number
    }) => {  
        const { minDistance, max } = this 
        if (minDistance) {
            if (newValue[1] - newValue[0] < minDistance) {
                if (activeThumb === 0) {
                  const clamped = Math.min(newValue[0], max - minDistance);
                  this.value = [clamped, clamped + minDistance]
                } else {
                  const clamped = Math.max(newValue[1], minDistance);
                  this.value = [clamped - minDistance, clamped];
                }
              } else {
                this.value = newValue
              }
        } else {
            this.value = newValue
        }
    }

    get current () {
        return {
            [this.key + '.min']: this.min,
            [this.key + '.max']: this.max
        }
    }

    reset = () => {
        this.value = [this.defaultMinValue, this.defaultMaxValue]
    }
}

export class BooleanFilter extends Filter {
    value: boolean = false
    defaultValue: boolean
    type: FilterType = FilterType.boolean

    constructor ({ defaultValue, ...props }: IBooleanFilter) {
        super(props)
        this.value = !!defaultValue
        this.defaultValue = !!defaultValue
    }

    onChange: (...args: any[]) => void = () => {
        this.value = !this.value
    }

    get current () {
        return {
            [this.key]: this.value
        }
    }

    reset = () => {
        this.value = this.defaultValue
    }
}

