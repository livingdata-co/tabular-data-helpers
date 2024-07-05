import test from 'ava'
import iconv from 'iconv-lite'

import {selectEncoding, detectEncoding} from '../lib/detect-encoding.js'

test('selectEncoding empty', t => {
  t.is(selectEncoding([]), 'UTF-8')
})

test('selectEncoding one allowed', t => {
  t.is(selectEncoding([{name: 'ISO-8859-1'}]), 'ISO-8859-1')
})

test('selectEncoding one rejected', t => {
  t.is(selectEncoding([{name: 'ISO-8859-9'}]), 'UTF-8')
})

test('selectEncoding multiple allowed', t => {
  t.is(selectEncoding([
    {name: 'ISO-8859-9'},
    {name: 'ISO-8859-1'},
    {name: 'ISO-8859-6'}
  ]), 'ISO-8859-1')
})

test('selectEncoding multiple rejected', t => {
  t.is(selectEncoding([
    {name: 'ISO-8859-9'},
    {name: 'ISO-8859-8'}
  ]), 'UTF-8')
})

test('detectEncoding / UTF-8', t => {
  const text = iconv.encode('éléphant', 'UTF-8')
  t.is(detectEncoding(text), 'UTF-8')
})

test('detectEncoding / ISO-8859-1', t => {
  const text = iconv.encode('éléphant', 'ISO-8859-1')
  t.is(detectEncoding(text), 'ISO-8859-1')
})

test('detectEncoding / fallback UTF-8 when unknown', t => {
  const text = iconv.encode('Ğ}', 'ISO-8859-9')
  t.is(detectEncoding(text), 'UTF-8')
})
