
# 支付相关 API

## 获取代币产品列表

- URL: `GET /payment/coins`
- REQ: `{ headers?: AUTH_HEADER }`
- RES: `ERROWS_RESPONSE<COIN_PRODUCT[]>`

## 获取订阅套餐列表

- URL: `GET /payment/subscriptions`
- REQ: `{ headers?: AUTH_HEADER }`
- RES: `ERROWS_RESPONSE<SUBSCRIPTION_PRODUCT[]>`

## 购买代币

- URL: `POST /payment/coins/:product_id/checkout`
- REQ: `ERROWS_AUTH_REQ`
- RES: `ERROWS_RESPONSE<{ id: string, checkout_url: string }>`

## 购买订阅

- URL: `POST /payment/subscriptions/:product_id`
- REQ: `ERROWS_AUTH_REQ`
- RES: `ERROWS_RESPONSE<{ id: string, checkout_url: string }>`

## 查询付款状态

- URL: `GET /payment/:payment_id/status`
- REQ: `ERROWS_AUTH_REQ`
- RES: `ERROWS_RESPONSE<{ status: 'pending' | 'succeeded' | 'failed' }>`


## 更新代币产品信息

- URL: `PUT /ops/payment/coins`
- REQ: `ERROWS_AUTH_JSON_REQ<{ products: COIN_PRODUCT[] }>`
- RES: `HTTP_204_RES`

## 更新订阅产品信息

- URL: `PUT /ops/payment/subscriptions/:type`
- REQ:
```
ERROWS_AUTH_JSON_REQ<{ products: SUBSCRIPTION_PRODUCT[] }> & {
  params: { type: 'monthly' | 'yearly'; }
}
```
- RES: `HTTP_204_RES`


# API 概览

[API TOC](./readme.md#toc)