export const UnknownType = "Unknown"


/**
 * @param {TypedObject} obj
 * @return {Type}
 */
export function typeOf(obj) {
    return obj.constructor
}

/**
 * @param {Type} type
 * @return {TypedObject}
 */
export function makeInstanceOf(type) {
    return new type()
}

/**
 * @param {Type} type
 * @return {Type|null}
 */
export function superTypeOf(type) {
    let superType = Object.getPrototypeOf(type.prototype).constructor
    return superType.name === "Object" ? null : superType
}

/**
 * @param {Type} type
 * @return {string[]}
 */
function allPropertyNamesOf(type) {
    if (type === null) return []
    let obj = makeInstanceOf(type)
    return Object.getOwnPropertyNames(obj)
}

/**
 * @param {Type} type
 * @return {string[]}
 */
function exclusivePropertyNamesOf(type) {
    if (type === null) return []
    let all = allPropertyNamesOf(type)
    let superProps = allPropertyNamesOf(superTypeOf(type))
    return all.filter(it => !superProps.includes(it))
}

/**
 * @param {Type} type
 * @return {[string, string][]}
 */
function taggedPropertyNamesOf(type) {
    if (type === null) return []
    let typeName = type.name
    let props = exclusivePropertyNamesOf(type).map(it => [it, typeName])
    let superProps = taggedPropertyNamesOf(superTypeOf(type))
    return props.concat(superProps)
}

/**
 * @param {TypedObject} obj
 * @return {Property[]}
 */
export function propertiesOf(obj) {
    let type = typeOf(obj)
    let taggedProps = taggedPropertyNamesOf(type)

    function definingTypeOf(propName) {
        return taggedProps.find(it => it[0] === propName)[1]
    }

    return Object.entries(obj)
        .map(([propName, value]) => ({
            definition: {
                name: propName,
                definedOn: definingTypeOf(propName),
                typeName: getThingTypeName(value)
            },
            value: value
        }))
}

/**
 * @param {TypedObject} obj
 * @return {Property[]}
 */
export function ownPropertiesOf(obj) {
    let all = propertiesOf(obj)
    let typeName = typeOf(obj).name
    return all.filter(prop => prop.definition.definedOn === typeName)
}

/**
 * @param {TypedObject} obj
 * @return {TypedObject|null}
 */
export function trimToSuperType(obj) {
    let type = typeOf(obj)
    let superType = superTypeOf(type)

    if (superType !== null) {
        let superPropertyNames = allPropertyNamesOf(superType)
        let instance = makeInstanceOf(superType)

        Object.entries(obj)
            .forEach(([key, value]) => {
                if (superPropertyNames.includes(key))
                    instance[key] = value
            })

        return instance
    }else
        return null
}

/**
 * @param {*} thing
 * @return {string}
 */
export function getThingTypeName(thing) {
    if (thing === null || thing === undefined) return UnknownType
    return typeOf(thing).name
}

/**
 * @param {*} obj
 * @return {boolean}
 */
export function isNamedObject(obj) {
    return getThingTypeName(obj) !== "Object" && obj instanceof Object
}

/**
 * @param {Type} constructor
 * @return {Type}
 */
export function superClassOf(constructor) {
    let obj = new constructor()
    let superClass = Object.getPrototypeOf(Object.getPrototypeOf(obj)).constructor
    // If the object inherits directly from "Object",
    // it has no super-class
    return superClass.name === "Object" ? null : superClass;
}

/**
 * @param {TypedObject} obj
 * @return {string|null}
 */
export function getSuperClassName(obj) {
    let constructor = typeOf(obj)
    let superClass = superClassOf(constructor)
    return superClass?.name ?? null
}

/**
 * @param {TypedObject} obj
 * @return {Property[]}
 */
export function getProperties(obj) {
    return Object.entries(obj)
        .map(([key, value]) => ({
            definition: {
                name: key,
                typeName: getThingTypeName(value)
            },
            value: value
        }))
}
