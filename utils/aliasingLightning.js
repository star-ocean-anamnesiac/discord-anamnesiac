// import I * from './item'

// const items = [
//     {
//     name: 'Striped Cat Mitts',
//     cat: 'gl',
//     star: 5,
//     picture: 'Striped_Cat_Mitts',
//     atk: 961,
//     int: 958,
//     factors:
//      [ { desc: 'Imbues attacks with light', element: 'Light' },
//        { desc: 'Light damage dealt +20%', meta: [Object] },
//        { desc: 'AP cost -10%', meta: [Object] },
//        { desc: '80% chance of surviving a lethal attack when at 10% of max HP or more',
//          lb: 5 } ],
//     obtained: 'Gacha',
//     notes: 'Light imbue arms and as I type this the only elemental arms you can get. A must keep, even if you don\'t have HMillie these will come in useful later.\n',
//     type: 'weapon',
//     subtype: 'arm'
//   },
//   {
//   name: 'some weap',
//   cat: 'gl',
//   star: 5,
//   picture: 'Striped_Cat_Mitts',
//   atk: 961,
//   int: 958,
//   factors:
//    [ { desc: 'Imbues attacks with lightning', element: 'Lightning' },
//      { desc: 'Lightning damage dealt +20%', meta: [Object] },
//      { desc: 'AP cost -10%', meta: [Object] },
//      { desc: '80% chance of surviving a lethal attack when at 10% of max HP or more',
//        lb: 5 } ],
//   obtained: 'Gacha',
//   notes: 'Lightning imbue arms and as I type this the only elemental arms you can get. A must keep, even if you don\'t have HMillie these will come in useful later.\n',
//   type: 'weapon',
//   subtype: 'arm'
// }
// ]

const containsLightning = element => {
  if(element) {
    return element.search('ightning')
  } else {
    return false
  }

}

const replaceWordLightningToThunder = (nodeProperty) => {
  if(nodeProperty) {
    return nodeProperty.replace(/lightning/gi, 'Thunder')
  } else {
    return nodeProperty
  }

}

// this function will look up item factors and notes prop
// if the word "lightning" found then it will replace t to thunderthe returned value is the copy of the item
// else it will return the item

const aliasingLightning = item => {
  const {factors} = item
  const [first,second, ...rest] = factors
  if(
    containsLightning(item.factors[0].element) ||
    containsLightning(item.factors[0].desc) ||
    containsLightning(item.notes)) {
    return second != undefined ? Object.assign({}, item, {
      factors: [
        Object.assign({}, factors.desc, {
          desc: replaceWordLightningToThunder(first.desc),
          element: replaceWordLightningToThunder(first.element),
        }),
        Object.assign({}, factors.desc, {
          desc: replaceWordLightningToThunder(second.desc),
          meta: second.meta,
        }),
        ...rest
      ],
      notes: replaceWordLightningToThunder(item.notes)
    }) :  Object.assign({}, item, {
      factors: [
        Object.assign({}, factors.desc, {
          desc: replaceWordLightningToThunder(first.desc),
          element: replaceWordLightningToThunder(first.element),
        }),
        ...rest
      ],
      notes: replaceWordLightningToThunder(item.notes)
    })

  } else {
    return item
  }
}

module.exports = {aliasingLightning}
