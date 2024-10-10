<p align="center">
  <img height="400" src="https://raw.githubusercontent.com/exelord/solid-proxies/main/logo.png" alt="Solid Proxies logo" />
</p>

# Solid Proxies

Solid Proxies is a JavaScript library that provides signaled versions of JavaScript's built-in objects. This means that all changes to the properties of these objects will be automatically tracked when using the standard API. For example, operations like `array.push`, `array.slice`, or direct index access like `person['name']` will only trigger an update of specific values. This granular reactivity ensures that your effects will not rerun unnecessarily.

## Table of Contents

- [Solid Proxies](#solid-proxies)
  - [Table of Contents](#table-of-contents)
  - [Installation](#installation)
  - [Compatibility](#compatibility)
  - [Demo](#demo)
  - [Usage](#usage)
    - [SignaledObject](#signaledobject)
    - [SignaledArray](#signaledarray)

## Installation

```
npm install solid-proxies
```

## Compatibility

- Solid.js ^1.0

## Demo

CodeSandbox demo: [Link](https://codesandbox.io/s/solid-proxies-pt2slm)

## Usage

### SignaledObject

SignaledObject is a variant of the standard JavaScript `Object` type that automatically tracks changes to its properties. This means that any operation that modifies the properties of a `SignaledObject`, such as setting a new value, deleting a property, or checking the keys of the object, will trigger an update and make your code react to the change.

To use `SignaledObject`, you can import the `createObject` function from the solid-proxies library:

```js
import { createObject } from 'solid-proxies';
```

Then, you can create a new SignaledObject by calling createObject and passing in an object literal as an argument (optionally):

```js
const user = createObject({ name: "Maciej" });
```

You can then use the SignaledObject like a normal JavaScript object, but any changes you make to its properties will be tracked and can be reacted to by your code. For example:

```js
createEffect(() => {
  console.log(user.name);
});

// After some time...
user.name = "Exelord"; // This change will rerun the effect
```

**Important:** SignaledObjects are not deep wrapped. This means that an object within a SignaledObject would need to be signaled individually.

Here is an example of how you can use SignaledObject to track changes to a nested object:

```js
const user = createObject({
  name: "Maciej",
  address: createObject({
    city: "New York",
    country: "USA"
  })
});

createEffect(() => {
  console.log(user.address.city);
});

// After some time...
user.address.city = "London"; // This change will rerun the effect
```

### SignaledArray

SignaledArray is a variant of the standard JavaScript `Array` type that automatically tracks changes to its elements. This means that any operation that modifies the elements of a `SignaledArray`, such as setting a new value, deleting an element, or adding a new element, will trigger an update and make your code react to the change.

To use `SignaledArray`, you can import the `createArray` function from the solid-proxies library:

```js
import { createArray } from 'solid-proxies';
```

Then, you can create a new SignaledArray by calling createArray and passing in an array literal as an argument:

```js
const users = createArray([{ name: "Maciej" }]);
```

You can then use the SignaledArray like a normal JavaScript array, but any changes you make to its elements will be tracked and can be reacted to by your code. For example:

```js
createEffect(() => {
  console.log(users[0].name);
});

// After some time...
users[0] = { name: "Exelord" }; // This change will rerun the effect
```

**Important:** SignaledArrays are not deep wrapped. This means that an array or object within a SignaledArray would need to be signaled individually.

Here is an example of how you can use SignaledArray to track changes to a nested array:

```js
const users = createArray([
  {
    name: "Maciej",
    favoriteColors: ["red", "blue"]
  }
]);

createEffect(() => {
  console.log(users[0].favoriteColors[0]);
});

// After some time...
users[0].favoriteColors[0] = "green"; // This change will NOT rerun the effect

// To track changes to the favoriteColors array itself, you would need to create a new
// SignaledArray for it:
users[0].favoriteColors = createArray(["yellow", "purple"]);

// And then...
users[0].favoriteColors[0] = "green"; // This change WILL rerun the effect
```
