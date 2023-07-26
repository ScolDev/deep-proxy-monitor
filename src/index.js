const defaultHandler = {
  get: function (target, prop) {
    return target[prop]
  }
}

const defaultMonitorStrategy = (objToMonitor, prop) => {
  if (!objToMonitor[prop]) { objToMonitor[prop] = true }
}

const cloneWithProxy = ({ objToProxy, handler, withMonitor = false, monitorStrategy }) => {
  const newObj = {}
  const monitorObj = {}
  const keys = Object.keys(objToProxy)
  const baseHandler = !withMonitor ? handler : buildHandlerWithMonitor(monitorObj, monitorStrategy.strategy)

  for (const key of keys) {
    buildProxyAndMonitorObject({
      value: objToProxy[key],
      handler,
      withMonitor,
      monitorStrategy,
      newObj,
      monitorObj,
      key
    })
  }

  return [new Proxy(newObj, baseHandler), monitorObj]
}

const buildProxyAndMonitorObject = ({ value, handler, withMonitor, monitorStrategy, newObj, monitorObj, key }) => {
  if (value === null || typeof value !== 'object') {
    newObj[key] = value

    if (withMonitor) {
      monitorObj[key] = monitorStrategy.defaultValue
    }
    return
  }

  if (value instanceof Array) {
    for (const child of value) {
      const [proxy, monitor] = cloneWithProxy({
        objToProxy: child,
        handler,
        withMonitor,
        monitorStrategy
      })

      if (!newObj[key]) newObj[key] = []
      if (!monitorObj[key]) monitorObj[key] = []

      newObj[key].push(proxy)
      monitorObj[key].push(monitor)
    }
    return
  }

  const [proxy, monitor] = cloneWithProxy({
    objToProxy: value,
    handler,
    withMonitor,
    monitorStrategy
  })
  newObj[key] = proxy
  monitorObj[key] = monitor
}

const buildHandlerWithMonitor = (objToMonitor = {}, strategy = defaultMonitorStrategy) => {
  return {
    get: function (target, prop) {
      strategy(objToMonitor, prop)
      return target[prop]
    }
  }
}

export const deepProxy = (objToProxy, handler = defaultHandler) => {
  return cloneWithProxy({ objToProxy, handler })[0]
}

export const proxyMonitor = (objToProxy, monitorStrategy) => {
  if (typeof monitorStrategy === 'undefined') {
    monitorStrategy = {
      strategy: defaultMonitorStrategy,
      defaultValue: false
    }
  }

  if (!(monitorStrategy.strategy instanceof Function)) {
    throw new Error('Strategy must be a function.')
  }

  return cloneWithProxy({
    objToProxy,
    withMonitor: true,
    monitorStrategy,
    handler: defaultHandler
  })
}
