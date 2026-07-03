import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { paymentCoinApi, paymentPlanApi, paymentStatusApi } from '@/apis';
import { addPrefix } from '@/utils';
import { useGlobalServer } from '@/hooks/use-global-server';

const storageKey = addPrefix('payment');

type PaymentInfo =
  { type: 'coin', data: API.Payment.CoinProductInfo } |
  { type: 'plan', data: API.Payment.PalnInfo };

export function usePayment() {
  const [productId, setProductId] = React.useState<string>();
  const { setOpenPaymentStatus, paymentId, setPaymentId } = useGlobalServer();

  // 购买金币
  const {
    isPending: paymentCoinLoading,
    mutateAsync: paymentCoin,
  } = useMutation({
    mutationFn: paymentCoinApi,
    onSuccess: (data) => {
      setPaymentId(data.id);
    }
  });

  // 购买订阅计划
  const {
    isPending: paymentPlanLoading,
    mutateAsync: paymentPlan,
  } = useMutation({
    mutationFn: paymentPlanApi,
    onSuccess: (data) => {
      setPaymentId(data.id);
    }
  });

  // 获取支付状态
  const {
    isPending: paymentStatusLoading,
    mutateAsync: paymentStatus,
  } = useMutation({
    mutationFn: paymentStatusApi,
  });

  /**
   * 打开购买金币页面
   * @param data
   */
  function openPaymentCoin(data: API.Payment.CoinProductInfo) {
    localStorage.setItem(storageKey, JSON.stringify({
      type: 'coin',
      data,
    }));
    setProductId(data.id);
    paymentCoin(data.id)
      .then((data) => {
        setOpenPaymentStatus(true);
        window.open(data.checkout_url, '_blank');
      });
  }

  /**
   * 打开购买订阅计划页面
   * @param data
   */
  function openPaymentPlan(data: API.Payment.PalnInfo) {
    localStorage.setItem(storageKey, JSON.stringify({
      type: 'plan',
      data,
    }));
    setProductId(data.id);
    paymentPlan(data.id)
      .then((data) => {
        setOpenPaymentStatus(true);
        window.open(data.checkout_url, '_blank');
      });
  }

  /**
   * 获取支付信息
   * @returns
   */
  function getPaymentInfo(): PaymentInfo {
    return JSON.parse(localStorage.getItem(storageKey) || '') || {};
  }

  return {
    productId,
    paymentCoinLoading,
    paymentCoin,
    paymentPlanLoading,
    paymentPlan,
    paymentId,
    paymentStatusLoading,
    paymentStatus,
    openPaymentCoin,
    openPaymentPlan,
    getPaymentInfo,
  }
}
