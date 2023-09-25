// @ts-check

/**
 * @typedef {object} ProxyMonitorConfig
 * @property {Object.<string, any>} proxyObject Object to be built as a Proxy one.
 * @property {Object.<string, any>} monitorObj Object to be built as a monitoring object.
 * @property {ProxyTraps} handler Trap handler to be performed in the ProxyObject
 * @property {?} propertyValue Property value of the Proxy object iterated for the build process.
 * @property {string} key Iterated current property name.
 * @property {MonitorStrategy=} monitorStrategy Strategy object to be aplied to the monitor object.
 */

/**
 * @typedef {object} ProxyConfig Configuration object for build the new proxy object.
 * @property {Object.<string, any>} objToProxy Object to be transformed into a proxy.
 * @property {ProxyTraps} handler Object containing the proxy traps to be called when properties are accessed.
 * @property {MonitorStrategy=} monitorStrategy Object containing the strategy algorithm for the monitor object.
 */

/**
 * @typedef {object} ProxyTraps Object containing the proxy traps to be called when properties are accessed.
 * @property {Trap} get Trap function to be executed when reading a property value.
 */

/**
 * @callback Trap Trap function to be executed when reading a property value.
 * @param {Object.<string, any>} target The proxy object to perform the trap function.
 * @param {string} prop Current property that has been accessed.
 * @returns {?} The new value to be set into the proxy object.
 */

/**
 * @typedef {object} MonitorStrategy Object containing the strategy algorithm for the monitor object.
 * @property {Strategy} strategy The algorithm to be executed when the properties for the proxy object are accessed.
 * @property {any} initialValue The initial value for all monitor object properties.
 */

/**
 * @callback Strategy The algorithm to be executed when the properties for the proxy object are accessed.
 * @param {Object.<string, any>} monitorObject The monitor object to be performed the strategy algorithm.
 * @param {string} prop The current property name to be performed the strategy algorithm.
 * @returns {void}
 */

/** @type {ProxyTraps} */
const defaultHandler = {
  /** @type {Trap} */
  get: function (target, prop) {
    return target[prop]
  }
}

/** @type {Strategy} */
const defaultMonitorStrategy = (monitorObject, prop) => {
  if (!monitorObject[prop]) {
    monitorObject[prop] = true
  }
}

/**
 * @param {ProxyConfig} configObject Configurations for the clonning process
 * @returns {[Object.<string, any>, Object.<string, any>]} Returns an array containing the proxy and monitor object.
 */
const cloneWithProxy = ({ objToProxy, handler, monitorStrategy }) => {
  const proxyObject = {}
  const monitorObj = {}
  const keys = Object.keys(objToProxy)
  const baseHandler = monitorStrategy
    ? buildHandlerWithMonitor(monitorObj, monitorStrategy.strategy)
    : handler
  for (const key of keys) {
    buildProxyAndMonitorObject({
      proxyObject,
      propertyValue: objToProxy[key],
      handler,
      monitorStrategy,
      monitorObj,
      key
    })
  }
  return [new Proxy(proxyObject, baseHandler), monitorObj]
}

/**
 * @param {ProxyMonitorConfig} config
 * @returns {void}
 */
const buildProxyAndMonitorObject = ({ proxyObject, monitorObj, monitorStrategy, handler, propertyValue, key }) => {
  if (propertyValue === null || typeof propertyValue !== 'object') {
    proxyObject[key] = propertyValue
    if (monitorStrategy) {
      monitorObj[key] = monitorStrategy.initialValue
    }
    return
  }
  if (propertyValue instanceof Array) {
    for (const child of propertyValue) {
      const [proxy, monitor] = cloneWithProxy({
        objToProxy: child,
        handler,
        monitorStrategy
      })
      if (!proxyObject[key]) { proxyObject[key] = [] }
      if (!monitorObj[key]) { monitorObj[key] = [] }
      proxyObject[key].push(proxy)
      monitorObj[key].push(monitor)
    }
    return
  }
  const [proxy, monitor] = cloneWithProxy({
    objToProxy: propertyValue,
    handler,
    monitorStrategy
  })
  proxyObject[key] = proxy
  monitorObj[key] = monitor
}

/**
 * @param {Object.<string, any>} objToMonitor The object to be monitored.
 * @param {Strategy} strategy The strategy algorithm to be performed.
 * @returns {ProxyTraps}
 */
const buildHandlerWithMonitor = (objToMonitor = {}, strategy = defaultMonitorStrategy) => {
  return {
    get: function (target, prop) {
      strategy(objToMonitor, prop)
      return target[prop]
    }
  }
}

/**
 * @param {Object.<string, any>} objToProxy Object to convert to a deep proxy one.
 * @param {ProxyTraps} handler Object containing the traps for the proxy object.
 * @returns {Object.<string, any>} A deep proxy object.
 */
export const deepProxy = (objToProxy, handler = defaultHandler) => {
  return cloneWithProxy({ objToProxy, handler })[0]
}

/**
 * @param {object} objToProxy Object to be proxy.
 * @param {MonitorStrategy=} monitorStrategy An object containing the strategy to be used in the proxy object.
 * @returns {[Object.<string, any>, Object.<string, any>]} Returns an array containing the proxy and monitor object.
 */
export const proxyMonitor = (objToProxy, monitorStrategy) => {
  if (typeof monitorStrategy === 'undefined') {
    monitorStrategy = {
      strategy: defaultMonitorStrategy,
      initialValue: false
    }
  }
  if (!(monitorStrategy.strategy instanceof Function)) {
    throw new Error('Strategy must be a function.')
  }
  return cloneWithProxy({
    objToProxy,
    monitorStrategy,
    handler: defaultHandler
  })
}
