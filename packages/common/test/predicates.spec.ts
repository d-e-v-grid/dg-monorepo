import {
  isNan,
  isNil,
  isOdd,
  isMap,
  isSet,
  getTag,
  isNull,
  isEven,
  isDate,
  isArray,
  isClass,
  isExist,
  isFloat,
  isError,
  isString,
  isNumber,
  isBuffer,
  isFinite,
  isBigInt,
  isPrefix,
  isSuffix,
  isRegexp,
  isSymbol,
  isObject,
  isInteger,
  isNumeral,
  isBoolean,
  isPromise,
  isFunction,
  isInfinite,
  isUndefined,
  isSubstring,
  isPrimitive,
  getTagSimple,
  isPlainObject,
  isSafeInteger,
  isEmptyString,
  isArrayBuffer,
  isEmptyObject,
  isNegativeZero,
  isPropertyOwned,
  isNumeralBigInt,
  isAsyncFunction,
  isNumeralInteger,
  isArrayBufferView,
  isPropertyDefined
} from "../src/predicates";

describe("predicates", () => {
  describe("getTag", () => {
    it("should handle null and undefined", () => {
      expect(getTag(null)).toBe("[object Null]");
      expect(getTag(undefined)).toBe("[object Undefined]");
    });

    it("should handle objects with Symbol.toStringTag", () => {
      // Обычный объект с configurable toStringTag
      const obj1 = {};
      Object.defineProperty(obj1, Symbol.toStringTag, {
        value: "Test",
        configurable: true
      });
      expect(getTag(obj1)).toBe("[object Test]");

      // Объект с non-configurable toStringTag
      const obj2 = {};
      Object.defineProperty(obj2, Symbol.toStringTag, {
        value: "Test",
        configurable: false
      });
      expect(getTag(obj2)).toBe("[object Test]");

      // Примитив с toStringTag
      const str = Object("test");
      Object.defineProperty(str, Symbol.toStringTag, {
        value: "MyString"
      });
      expect(getTag(str)).toBe("[object MyString]");

      // Встроенные объекты с toStringTag
      expect(getTag(new Map())).toBe("[object Map]");
      expect(getTag(new Set())).toBe("[object Set]");
    });
  });

  describe("getTagSimple", () => {
    it("should return correct tags", () => {
      expect(getTagSimple([])).toBe("array");
      expect(getTagSimple({})).toBe("object");
      expect(getTagSimple(null)).toBe("null");
    });
  });

  describe("type checks", () => {
    it("should check arrays", () => {
      expect(isArray([])).toBe(true);
      expect(isArray({})).toBe(false);
    });

    it("should check functions", () => {
      expect(isFunction(() => { })).toBe(true);
      expect(isFunction({})).toBe(false);
    });

    it("should check strings", () => {
      expect(isString("test")).toBe(true);
      expect(isString(new String("test"))).toBe(true);
      expect(isString(123)).toBe(false);
    });

    it("should check numbers", () => {
      expect(isNumber(123)).toBe(true);
      expect(isNumber("123")).toBe(false);
    });

    it("should check buffers", () => {
      const buffer = Buffer.from("test");
      expect(isBuffer(buffer)).toBe(true);
      expect(isBuffer({})).toBe(false);
    });

    it("should check plain objects", () => {
      expect(isPlainObject({})).toBe(true);
      expect(isPlainObject(Object.create(null))).toBe(true);
      expect(isPlainObject([])).toBe(false);
      expect(isPlainObject(new class Test { })).toBe(false);
    });

    it("should check property ownership", () => {
      const obj = { test: 123 };
      expect(isPropertyOwned(obj, "test")).toBe(true);
      expect(isPropertyOwned(obj, "toString")).toBe(false);
    });

    it("should check null and undefined", () => {
      expect(isNull(null)).toBe(true);
      expect(isNull(undefined)).toBe(false);
      expect(isUndefined(undefined)).toBe(true);
      expect(isUndefined(null)).toBe(false);
    });

    it("should check classes", () => {
      class Test { }
      expect(isClass(Test)).toBe(true);
      expect(isClass(() => { })).toBe(false);
    });

    it("should check numeric types", () => {
      expect(isNan(NaN)).toBe(true);
      expect(isFinite(123)).toBe(true);
      expect(isInteger(123)).toBe(true);
      expect(isSafeInteger(Number.MAX_SAFE_INTEGER)).toBe(true);
    });

    it("should check existence", () => {
      expect(isExist({})).toBe(true);
      expect(isExist(null)).toBe(false);
      expect(isExist(undefined)).toBe(false);
    });

    it("should check nil values", () => {
      expect(isNil(null)).toBe(true);
      expect(isNil(undefined)).toBe(true);
      expect(isNil({})).toBe(false);
    });

    it("should check empty strings", () => {
      expect(isEmptyString("")).toBe(true);
      expect(isEmptyString(" ")).toBe(true);
      expect(isEmptyString("test")).toBe(false);
    });

    it("should check numerals", () => {
      expect(isNumeral("123")).toBe(true);
      expect(isNumeral(123)).toBe(true);
      expect(isNumeral("abc")).toBe(false);
    });

    it("should check BigInt", () => {
      expect(isBigInt(BigInt(123))).toBe(true);
      expect(isBigInt(123)).toBe(false);
    });

    it("should check numeral BigInt", () => {
      expect(isNumeralBigInt("123n")).toBe(true);
      expect(isNumeralBigInt("-123n")).toBe(true);
      expect(isNumeralBigInt("0n")).toBe(true);
      expect(isNumeralBigInt("-0n")).toBe(true);
      expect(isNumeralBigInt("n")).toBe(false);
      expect(isNumeralBigInt("-n")).toBe(false);
      expect(isNumeralBigInt("abc123n")).toBe(false);
      expect(isNumeralBigInt("123")).toBe(false);
      expect(isNumeralBigInt("123.45n")).toBe(false);
      expect(isNumeralBigInt(123 as any)).toBe(false);
      expect(isNumeralBigInt(undefined as any)).toBe(false);
      expect(isNumeralBigInt(null as any)).toBe(false);
    });

    it("should check numeral integers", () => {
      expect(isNumeralInteger("123")).toBe(true);
      expect(isNumeralInteger("123.45")).toBe(false);
    });

    it("should check infinite values", () => {
      expect(isInfinite(Infinity)).toBe(true);
      expect(isInfinite(-Infinity)).toBe(true);
      expect(isInfinite(123)).toBe(false);
    });

    it("should check odd and even numbers", () => {
      expect(isOdd(3)).toBe(true);
      expect(isOdd(2)).toBe(false);
      expect(isEven(2)).toBe(true);
      expect(isEven(3)).toBe(false);
    });

    it("should check float numbers", () => {
      expect(isFloat(123.45)).toBe(true);
      expect(isFloat(123)).toBe(false);
    });

    it("should check negative zero", () => {
      expect(isNegativeZero(-0)).toBe(true);
      expect(isNegativeZero(0)).toBe(false);
    });

    it("should check substrings", () => {
      expect(isSubstring("test", "testing")).toBe(true);
      expect(isSubstring("xyz", "testing")).toBe(false);
    });

    it("should check prefixes", () => {
      expect(isPrefix("test", "testing")).toBe(true);
      expect(isPrefix("", "testing")).toBe(true);
      expect(isPrefix("xyz", "testing")).toBe(false);
      expect(isPrefix("test", "")).toBe(false);
      expect(isPrefix("", "")).toBe(true);
      expect(isPrefix(123 as any, "testing")).toBe(false);
      expect(isPrefix("test", 123 as any)).toBe(false);
      expect(isPrefix(null as any, "test")).toBe(false);
      expect(isPrefix("test", null as any)).toBe(false);
    });

    it("should check suffixes", () => {
      expect(isSuffix("ing", "testing")).toBe(true);
      expect(isSuffix("", "testing")).toBe(true);
      expect(isSuffix("xyz", "testing")).toBe(false);
      expect(isSuffix("test", "")).toBe(false);
      expect(isSuffix("", "")).toBe(true);
      expect(isSuffix(123 as any, "testing")).toBe(false);
      expect(isSuffix("test", 123 as any)).toBe(false);
      expect(isSuffix(null as any, "test")).toBe(false);
      expect(isSuffix("test", null as any)).toBe(false);
    });

    it("should check booleans", () => {
      expect(isBoolean(true)).toBe(true);
      expect(isBoolean(false)).toBe(true);
      expect(isBoolean("true")).toBe(false);
    });

    it("should check ArrayBuffer", () => {
      expect(isArrayBuffer(new ArrayBuffer(8))).toBe(true);
      expect(isArrayBuffer({})).toBe(false);
    });

    it("should check ArrayBufferView", () => {
      expect(isArrayBufferView(new Uint8Array())).toBe(true);
      expect(isArrayBufferView(new ArrayBuffer(8))).toBe(false);
    });

    it("should check Date", () => {
      expect(isDate(new Date())).toBe(true);
      expect(isDate("2023-01-01")).toBe(false);
    });

    it("should check Error", () => {
      expect(isError(new Error())).toBe(true);
      expect(isError({})).toBe(false);
    });

    it("should check Map", () => {
      expect(isMap(new Map())).toBe(true);
      expect(isMap({})).toBe(false);
    });

    it("should check RegExp", () => {
      expect(isRegexp(/test/)).toBe(true);
      expect(isRegexp("test")).toBe(false);
    });

    it("should check Set", () => {
      expect(isSet(new Set())).toBe(true);
      expect(isSet([])).toBe(false);
    });

    it("should check Symbol", () => {
      expect(isSymbol(Symbol("test"))).toBe(true);
      expect(isSymbol("test")).toBe(false);
    });

    it("should check primitives", () => {
      expect(isPrimitive("test")).toBe(true);
      expect(isPrimitive(123)).toBe(true);
      expect(isPrimitive({})).toBe(false);
    });

    it("should check objects", () => {
      expect(isObject({})).toBe(true);
      expect(isObject([])).toBe(true);
      expect(isObject(null)).toBe(false);
    });

    it("should check empty objects", () => {
      expect(isEmptyObject({})).toBe(true);
      expect(isEmptyObject({ test: 123 })).toBe(false);
    });

    it("should check property defined", () => {
      const obj = { a: { b: { c: 123 } } };
      expect(isPropertyDefined(obj, "a.b.c")).toBe(true);
      expect(isPropertyDefined(obj, "a.b.d")).toBe(false);
    });

    it("should check async functions", () => {
      expect(isAsyncFunction(async () => { })).toBe(true);
      expect(isAsyncFunction(() => { })).toBe(false);
    });

    it("should check promises", () => {
      expect(isPromise(Promise.resolve())).toBe(true);
      expect(isPromise({})).toBe(false);
    });

    it("should handle edge cases for isSubstring", () => {
      // Базовые случаи
      expect(isSubstring("test", "testing")).toBe(true);
      expect(isSubstring("xyz", "testing")).toBe(false);

      // Пустые строки
      expect(isSubstring("", "testing")).toBe(true);
      expect(isSubstring("", "")).toBe(true);
      expect(isSubstring("test", "")).toBe(false);

      // Смещения
      expect(isSubstring("test", "testing", 0)).toBe(true);
      expect(isSubstring("test", "testing", 1)).toBe(false);
      expect(isSubstring("ing", "testing", 4)).toBe(true);

      // Отрицательные смещения
      expect(isSubstring("test", "testing", -7)).toBe(true); // эквивалентно offset 0
      expect(isSubstring("test", "testing", -6)).toBe(false); // эквивалентно offset 1
      expect(isSubstring("test", "testing", -5)).toBe(false);

      // Некорректные типы и значения
      expect(isSubstring(null as any, "test")).toBe(false);
      expect(isSubstring("test", null as any)).toBe(false);
      expect(isSubstring("test", "testing", NaN)).toBe(true);
      expect(isSubstring("test", "testing", undefined)).toBe(true);
      expect(isSubstring("test", "testing", "0" as any)).toBe(true);
      expect(isSubstring("test", "testing", {} as any)).toBe(true);

      // Граничные случаи смещения
      expect(isSubstring("test", "testing", 1000)).toBe(false);
      expect(isSubstring("test", "testing", -1000)).toBe(true); // эквивалентно offset 0
    });

    it("should handle edge cases for isPropertyDefined", () => {
      const obj = {
        a: {
          b: {
            c: 123,
            d: null,
            e: undefined
          }
        },
        "x.y.z": 456
      };

      expect(isPropertyDefined(obj, "")).toBe(false);
      expect(isPropertyDefined(obj, "a.b.c")).toBe(true);
      expect(isPropertyDefined(obj, "a.b.d")).toBe(true);
      expect(isPropertyDefined(obj, "a.b.e")).toBe(true);
      expect(isPropertyDefined(obj, "a.b.f")).toBe(false);
      expect(isPropertyDefined(obj, "x.y.z")).toBe(false); // точка в имени свойства
      expect(isPropertyDefined(null, "a.b.c")).toBe(false);
      expect(isPropertyDefined(undefined, "a.b.c")).toBe(false);
      expect(isPropertyDefined({}, null as any)).toBe(false);
      expect(isPropertyDefined({}, undefined as any)).toBe(false);
      expect(isPropertyDefined({}, "" as any)).toBe(false);
    });

    it("should handle complex objects for isPropertyDefined", () => {
      const obj = {
        array: [{ a: 1 }, { b: 2 }],
        map: new Map([["key", "value"]]),
        set: new Set([1, 2, 3]),
        func() { return this.prop; },
        get prop() { return 42; }
      };

      expect(isPropertyDefined(obj, "array")).toBe(true);
      expect(isPropertyDefined(obj, "array.0")).toBe(true);
      expect(isPropertyDefined(obj, "array.0.a")).toBe(true);
      expect(isPropertyDefined(obj, "map")).toBe(true);
      expect(isPropertyDefined(obj, "set")).toBe(true);
      expect(isPropertyDefined(obj, "func")).toBe(true);
      expect(isPropertyDefined(obj, "prop")).toBe(true);
      expect(isPropertyDefined(obj, "map.get")).toBe(true);
      expect(isPropertyDefined(obj, "set.add")).toBe(true);
    });

    it("should handle prototype chain for isPropertyDefined", () => {
      class Parent {
        parentProp = 'parent';
      }
      class Child extends Parent {
        childProp = 'child';
      }
      const obj = new Child();

      expect(isPropertyDefined(obj, "parentProp")).toBe(true);
      expect(isPropertyDefined(obj, "childProp")).toBe(true);
      expect(isPropertyDefined(obj, "toString")).toBe(true);
      expect(isPropertyDefined(obj, "nonexistent")).toBe(false);
    });

    it("should handle special cases for isObject", () => {
      const proxy = new Proxy({}, {});
      const weakMap = new WeakMap();
      const weakSet = new WeakSet();

      expect(isObject(proxy)).toBe(true);
      expect(isObject(weakMap)).toBe(true);
      expect(isObject(weakSet)).toBe(true);
      expect(isObject(Object.create(null))).toBe(true);
      expect(isObject(new (class Custom { }))).toBe(true);
    });

    it("should handle special numbers", () => {
      expect(isNumeral(Number.MAX_SAFE_INTEGER)).toBe(true);
      expect(isNumeral(Number.MIN_SAFE_INTEGER)).toBe(true);
      expect(isNumeral(Number.EPSILON)).toBe(true);
      expect(isNumeral(Number.MAX_VALUE)).toBe(true);
      expect(isNumeral(Number.MIN_VALUE)).toBe(true);
      expect(isNumeral(NaN)).toBe(false);
      expect(isNumeral(Infinity)).toBe(false);
      expect(isNumeral(-Infinity)).toBe(false);
    });
  });
});
