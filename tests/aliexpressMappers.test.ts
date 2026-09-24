import assert from 'node:assert/strict'
import test from 'node:test'
import { mapProductResult } from '../lib/aliexpress/mappers'

test('keeps AliExpress SKU attribute names and uses seller custom display values when supplied', () => {
  const mapped = mapProductResult({
    ae_item_base_info_dto: {
      product_id: 123,
      category_id: 456,
      subject: 'Test product',
    },
    ae_item_sku_info_dtos: {
      ae_item_sku_info_d_t_o: [
        {
          sku_id: 'sku-1',
          sku_price: '10',
          offer_sale_price: '9',
          currency_code: 'USD',
          ae_sku_property_dtos: {
            ae_sku_property_d_t_o: [
              {
                sku_property_id: 14,
                sku_property_name: 'Color',
                sku_property_value: 'blue',
                property_value_definition_name: 'Navy Blue',
              },
              {
                sku_property_id: 25,
                sku_property_name: 'Size',
                sku_property_value: 'M',
                property_value_definition_name: '0',
              },
            ],
          },
        },
      ],
    },
  })

  assert.deepEqual(mapped.skus[0]?.specs, {
    Color: 'Navy Blue',
    Size: 'M',
  })
  assert.equal(mapped.skus[0]?.color, 'Navy Blue')
  assert.equal(mapped.skus[0]?.size, 'M')
})

test('falls back to the API SKU property value when no custom display value is supplied', () => {
  const mapped = mapProductResult({
    ae_item_base_info_dto: {
      product_id: 123,
      category_id: 456,
      subject: 'Test product',
    },
    ae_item_sku_info_dtos: {
      ae_item_sku_info_d_t_o: [
        {
          sku_id: 'sku-2',
          sku_price: '10',
          offer_sale_price: '9',
          currency_code: 'USD',
          ae_sku_property_dtos: {
            ae_sku_property_d_t_o: [
              {
                sku_property_id: 14,
                sku_property_name: 'color',
                sku_property_value: 'blue',
              },
            ],
          },
        },
      ],
    },
  })

  assert.deepEqual(mapped.skus[0]?.specs, { color: 'blue' })
  assert.equal(mapped.skus[0]?.color, 'blue')
})
