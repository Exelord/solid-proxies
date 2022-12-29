<p align="center">
  <img height="400" src="https://raw.githubusercontent.com/exelord/solid-proxies/main/logo.png" alt="Solid Proxies logo" />
</p>

# Solid Proxies

This package provides signaled versions of Javascript's built-in objects. Thanks to it, all theirs properties will be automatically tracked while using standard API. That means all operations like array's `push`, `slice` or direct index access `track['me']` will only trigger an update of specific values. The granular reactivity will make sure your effects will not rerun without a need.

Signaled built-ins:

- Object
- Array
- Map
- WeakMap
- Set
- WeakSet

## Installation

```
npm i solid-proxies
```

## Compatibility

- Solid.js ^1.0

## Demo

CodeSandbox demo: [Link](https://codesandbox.io/s/solid-proxies-pt2slm)

## Usage

### SignaledObject

`SignaledObject` will track all properties changes automatically. Setting new values, deleting, or checking keys will make your code react to changes.

```js
import { createObject } from 'solid-proxies';

const user = createObject({ name: "Maciej" })

createEffect(() => {
  console.log(user.name);
})

// After some time...
user.name = "Exelord" // This change will rerun the effect
```

**Important** SignaledObjects are not deep wrapped. Means an object in SignaledObject would need to be signaled individually.

### SignaledArray

`SignaledArray` will track any changes in the array automatically. Setting new values, deleting, or checking keys will make your code react to changes.

```js
import { createArray } from 'solid-proxies';

const users = createArray([{ name: "Maciej" }])

createEffect(() => {
  console.log(users[0].name);
})

// After some time...
users[0] = { name: "Exelord" } // This change will rerun the effect
```

**Important** SignaledArrays are not deep wrapped. Means an array or object in SignaledObject would need to be signaled individually.

### SignaledMap

`SignaledMap` will track any changes in the Map automatically. Setting new values, deleting, or checking keys will make your code react to changes.

```js
import { createMap } from 'solid-proxies';

const people = createMap([[1, "Maciej"]])

createEffect(() => {
  console.log(props.get(1));
})

// After some time...
props.set(1, 'Exelord') // This change will rerun the effect
```

### SignaledWeakMap

`SignaledWeakMap` will track any changes in the WeakMap automatically. Setting new values, deleting, or checking keys will make your code react to changes.

```js
import { createWeakMap } from 'solid-proxies';

const person = { name: "Maciej" };
const people = createWeakMap([[person, ({ name }) => `Hello ${name}!`]])

createEffect(() => {
  console.log(people.get(person)?.(person))
})

// After some time...
props.set(person, ({ name}) => `Welcome ${name}!`) // This change will rerun the effect
```

### SignaledSet

`SignaledSet` will track any changes in the Set automatically. Setting new values, deleting, or checking keys will make your code react to changes.

```js
import { createSet } from 'solid-proxies';

const people = createSet(["Maciej"])

createEffect(() => {
  console.log(props.has("Exelord"));
})

// After some time...
props.add("Exelord") // This change will rerun the effect
```

### SignaledWeakSet

`SignaledWeakSet` will track any changes in the WeakSet automatically. Setting new values, deleting, or checking keys will make your code react to changes.

```js
import { createWeakSet } from 'solid-proxies';

const person = { name: "Exelord" }
const people = createWeakSet()

createEffect(() => {
  console.log(props.has(person));
})

// After some time...
props.add(person) // This change will rerun the effect
```
