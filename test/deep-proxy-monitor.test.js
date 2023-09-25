// @ts-check

import { describe, test, expect, vi } from 'vitest'
import { deepProxy, proxyMonitor } from '../src/'

describe('tests for deepProxy functionalities', () => {
  const objToClone = {
    foo: 'foo',
    bar: {
      baz: 'baz',
      zoo: 'zoo',
      cat: {
        miu: 'miu'
      }
    }
  }
  test('should exist deepProxy function', () => {
    expect(deepProxy).toBeDefined()
  })

  test('should deep clone the object to proxy', () => {
    const clonned = deepProxy(objToClone)

    expect(clonned === objToClone).toBe(false)
    expect(objToClone.bar === clonned.bar).toBe(false)
    expect(objToClone).toStrictEqual(clonned)
  })

  test('should create a deep proxy clonned object', () => {
    const handler = {
      get: function (target, prop) {
        return target[prop]
      }
    }
    vi.spyOn(handler, 'get')

    const proxy = deepProxy(objToClone, handler)
    const { foo, bar } = proxy
    const { baz, zoo } = bar

    expect(handler.get).toBeCalledTimes(4)

    expect(foo).toStrictEqual(objToClone.foo)
    expect(bar).toStrictEqual(objToClone.bar)
    expect(baz).toStrictEqual(objToClone.bar.baz)
    expect(zoo).toStrictEqual(objToClone.bar.zoo)
  })

  test('should create a proxy with a monitor object to inspect access of all properties', () => {
    const [proxy, accessMonitor] = proxyMonitor(objToClone)

    const { foo, bar } = proxy
    const { zoo, cat } = bar
    const { miu } = cat

    expect(accessMonitor.foo).toBe(true)
    expect(accessMonitor.bar.baz).toBe(false)
    expect(accessMonitor.bar.zoo).toBe(true)
    expect(accessMonitor.bar.cat.miu).toBe(true)

    expect(foo).toEqual(objToClone.foo)
    expect(bar).toEqual(objToClone.bar)
    expect(zoo).toEqual(objToClone.bar.zoo)
    expect(cat).toStrictEqual(objToClone.bar.cat)
    expect(miu).toEqual(objToClone.bar.cat.miu)
  })

  test('should create a proxy with a monitor object with arrays support', () => {
    const objToClone = {
      foo: 'foo',
      bar: [{
        baz: 'baz',
        zoo: {
          cat: 'cat'
        }
      },
      {
        baz: 'baz',
        zoo: {
          cat: 'cat'
        }
      }]
    }
    const [proxy, accessMonitor] = proxyMonitor(objToClone)

    const { bar } = proxy
    const [first, second] = bar

    expect(first.baz).toBe('baz')
    expect(second.zoo.cat).toBe('cat')

    expect(accessMonitor.foo).toBe(false)
    expect(accessMonitor.bar[0].baz).toBe(true)
    expect(accessMonitor.bar[0].zoo.cat).toBe(false)
    expect(accessMonitor.bar[1].baz).toBe(false)
    expect(accessMonitor.bar[1].zoo.cat).toBe(true)

    // must be the last expects because the toStrictEquals dive into the entire object
    // calling all the proxies handlers
    expect(first).toStrictEqual(objToClone.bar[0])
    expect(second).toStrictEqual(objToClone.bar[1])
  })

  test('should create a proxy with a monitor object and custom monitor strategy', () => {
    const objToClone = {
      foo: 'foo',
      bar: [{
        baz: 'baz',
        zoo: {
          cat: 'cat'
        }
      }]
    }
    const monitorStrategy = {
      initialValue: 0,
      strategy: (objToMonitor, prop) => {
        if (typeof objToMonitor[prop] === 'number') {
          ++objToMonitor[prop]
        }
      }
    }

    const [proxy, accessMonitor] = proxyMonitor(objToClone, monitorStrategy)

    const { foo, bar } = proxy
    const [first] = bar

    expect(foo).toBe('foo')
    expect(first.zoo.cat).toBe('cat')
    expect(typeof first.zoo.cat).toBe('string')

    expect(accessMonitor.foo).toBe(1)
    expect(accessMonitor.bar[0].baz).toBe(0)
    expect(accessMonitor.bar[0].zoo.cat).toBe(2)
  })

  test('should create a proxy with a monitor object with null or undefined properties', () => {
    const objToClone = {
      foo: 'foo',
      bar: null,
      baz: undefined
    }
    const [proxy, accessMonitor] = proxyMonitor(objToClone)

    const { bar, baz } = proxy

    expect(bar).toBeNull()
    expect(baz).toBeUndefined()

    expect(accessMonitor.foo).toBe(false)
    expect(accessMonitor.bar).toBe(true)
    expect(accessMonitor.baz).toBe(true)
  })
})
