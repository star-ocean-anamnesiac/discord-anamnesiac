const containsLightning = element => {
  if(element) {
    return element.search('ightning');
  }
  return false;
};

const replaceWordLightningToThunder = (propVal) => {
  if(propVal) {
    return propVal.replace(/lightning/gi, 'Thunder');
  }
  return propVal;
}

const aliasLightning = item => {
  const isLightning = containsLightning(item.factors[0].element) || containsLightning(item.factors[0].desc) || containsLightning(item.notes);
  const {factors} = item;
  const [first,second, ...rest] = factors;

  if(isLightning) {
    if(second) {
      return Object.assign({}, item, {
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
      });
    }

    return Object.assign({}, item, {
      factors: [
        Object.assign({}, factors.desc, {
          desc: replaceWordLightningToThunder(first.desc),
          element: replaceWordLightningToThunder(first.element),
        }),
        ...rest
      ],
      notes: replaceWordLightningToThunder(item.notes)
    });
  }

  return item;
}

module.exports = {aliasLightning};
