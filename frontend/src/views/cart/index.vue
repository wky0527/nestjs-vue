<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>我的购物车</span>
          <div>
            <el-button v-if="cartItems.length > 0" type="danger" plain @click="handleClear">
              <el-icon><Delete /></el-icon>清空购物车
            </el-button>
          </div>
        </div>
      </template>

      <div v-loading="loading">
        <!-- 空状态 -->
        <el-empty v-if="cartItems.length === 0" description="购物车是空的，去逛逛吧~">
          <el-button type="primary" @click="$router.push('/products')">去购物</el-button>
        </el-empty>

        <!-- 购物车列表 -->
        <div v-else>
          <!-- 全选栏 -->
          <div class="select-all-bar">
            <el-checkbox v-model="allChecked" @change="handleToggleAll">全选</el-checkbox>
            <span class="item-count">共 {{ cartItems.length }} 件商品</span>
          </div>

          <!-- 商品列表 -->
          <div class="cart-list">
            <div v-for="item in cartItems" :key="item.id" class="cart-item" :class="{ disabled: !item.productOnSale }">
              <el-checkbox :model-value="item.checked" @change="(val: boolean) => handleToggleItem(item, val)" />
              <div class="item-info">
                <div class="item-image">
                  <el-image v-if="item.image" :src="item.image" fit="cover" style="width: 80px; height: 80px" />
                  <div v-else class="no-image">
                    <el-icon :size="30"><Picture /></el-icon>
                  </div>
                </div>
                <div class="item-detail">
                  <div class="item-name">{{ item.productName }}</div>
                  <div v-if="item.spec" class="item-spec">规格: {{ item.spec }}</div>
                  <div v-if="!item.productOnSale" class="item-warn">
                    <el-tag type="danger" size="small">商品已下架</el-tag>
                  </div>
                  <div v-if="item.currentStock < item.quantity && item.productOnSale" class="item-warn">
                    <el-tag type="warning" size="small">库存不足 (剩余{{ item.currentStock }}件)</el-tag>
                  </div>
                </div>
              </div>
              <div class="item-price">
                <span class="price">¥{{ Number(item.price).toFixed(2) }}</span>
              </div>
              <div class="item-quantity">
                <el-input-number
                  :model-value="item.quantity"
                  :min="1"
                  :max="item.currentStock || 99"
                  size="small"
                  @change="(val: number) => handleQuantityChange(item, val)"
                />
              </div>
              <div class="item-subtotal">
                ¥{{ (Number(item.price) * item.quantity).toFixed(2) }}
              </div>
              <div class="item-action">
                <el-button type="danger" link @click="handleRemove(item)">删除</el-button>
              </div>
            </div>
          </div>

          <!-- 结算栏 -->
          <div class="checkout-bar">
            <div class="checkout-info">
              <span>已选择 <b>{{ checkedCount }}</b> 件商品</span>
              <span class="total-amount">合计: <b>¥{{ checkedAmount.toFixed(2) }}</b></span>
            </div>
            <el-button type="primary" size="large" :disabled="checkedCount === 0" @click="showCheckout = true">
              去结算
            </el-button>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 结算弹窗 -->
    <el-dialog v-model="showCheckout" title="确认订单" width="560px">
      <el-form ref="checkoutFormRef" :model="checkoutForm" :rules="checkoutRules" label-width="90px">
        <el-form-item label="收货人" prop="receiverName">
          <el-input v-model="checkoutForm.receiverName" placeholder="请输入收货人姓名" />
        </el-form-item>
        <el-form-item label="收货电话" prop="receiverPhone">
          <el-input v-model="checkoutForm.receiverPhone" placeholder="请输入收货人电话" />
        </el-form-item>
        <el-form-item label="收货地址" prop="address">
          <el-input v-model="checkoutForm.address" type="textarea" :rows="2" placeholder="请输入详细收货地址" />
        </el-form-item>
        <el-form-item label="支付方式" prop="paymentMethod">
          <el-select v-model="checkoutForm.paymentMethod" style="width: 100%">
            <el-option label="在线支付" value="在线支付" />
            <el-option label="货到付款" value="货到付款" />
            <el-option label="余额支付" value="余额支付" />
          </el-select>
        </el-form-item>
        <el-form-item label="订单备注">
          <el-input v-model="checkoutForm.remark" type="textarea" :rows="2" placeholder="选填" />
        </el-form-item>
        <el-divider />
        <div class="checkout-summary">
          <div class="summary-row">
            <span>商品数量</span>
            <span>{{ checkedCount }} 件</span>
          </div>
          <div class="summary-row total">
            <span>应付金额</span>
            <span class="total-price">¥{{ checkedAmount.toFixed(2) }}</span>
          </div>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="showCheckout = false">返回购物车</el-button>
        <el-button type="primary" :loading="checkoutLoading" @click="handleCheckout">提交订单</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { getCart, updateCartQuantity, toggleCartChecked, toggleAllChecked, removeCartItem, clearCart, checkoutCart } from '@/api/cart'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const userId = computed(() => authStore.user?.id || 1)

const loading = ref(false)
const cartItems = ref<any[]>([])
const showCheckout = ref(false)
const checkoutLoading = ref(false)
const checkoutFormRef = ref<FormInstance>()

const checkoutForm = reactive({
  receiverName: '',
  receiverPhone: '',
  address: '',
  paymentMethod: '在线支付',
  remark: '',
})

const checkoutRules: FormRules = {
  receiverName: [{ required: true, message: '请输入收货人姓名', trigger: 'blur' }],
  receiverPhone: [{ required: true, message: '请输入收货人电话', trigger: 'blur' }],
  address: [{ required: true, message: '请输入收货地址', trigger: 'blur' }],
  paymentMethod: [{ required: true, message: '请选择支付方式', trigger: 'change' }],
}

const allChecked = computed({
  get: () => cartItems.value.length > 0 && cartItems.value.every(i => i.checked),
  set: () => {},
})

const checkedCount = computed(() => cartItems.value.filter(i => i.checked).reduce((sum, i) => sum + i.quantity, 0))
const checkedAmount = computed(() => cartItems.value.filter(i => i.checked).reduce((sum, i) => sum + Number(i.price) * i.quantity, 0))

async function fetchCart() {
  loading.value = true
  try {
    cartItems.value = await getCart(userId.value)
  } finally {
    loading.value = false
  }
}

async function handleToggleAll(checked: boolean) {
  await toggleAllChecked(userId.value, { checked })
  cartItems.value.forEach(i => (i.checked = checked))
}

async function handleToggleItem(item: any, checked: boolean) {
  await toggleCartChecked(item.id, { userId: userId.value, checked })
  item.checked = checked
}

async function handleQuantityChange(item: any, quantity: number) {
  if (quantity <= 0) return
  await updateCartQuantity(item.id, { userId: userId.value, quantity })
  item.quantity = quantity
}

async function handleRemove(item: any) {
  await ElMessageBox.confirm(`确定要删除 "${item.productName}" 吗？`, '提示', { type: 'warning' })
  await removeCartItem(item.id, userId.value)
  ElMessage.success('已删除')
  fetchCart()
}

async function handleClear() {
  await ElMessageBox.confirm('确定要清空购物车吗？', '提示', { type: 'warning' })
  await clearCart(userId.value)
  ElMessage.success('已清空')
  cartItems.value = []
}

async function handleCheckout() {
  const valid = await checkoutFormRef.value?.validate().catch(() => false)
  if (!valid) return

  checkoutLoading.value = true
  try {
    const checkedItems = cartItems.value.filter(i => i.checked)
    const result = await checkoutCart({
      userId: userId.value,
      address: checkoutForm.address,
      receiverName: checkoutForm.receiverName,
      receiverPhone: checkoutForm.receiverPhone,
      paymentMethod: checkoutForm.paymentMethod,
      remark: checkoutForm.remark || undefined,
      itemIds: checkedItems.map(i => i.id),
    })
    ElMessage.success(`成功创建 ${result.count} 个订单`)
    showCheckout.value = false
    cartItems.value = cartItems.value.filter(i => !i.checked)
    router.push('/orders')
  } catch (e: any) {
    ElMessage.error(e?.message || '结算失败')
  } finally {
    checkoutLoading.value = false
  }
}

onMounted(() => {
  fetchCart()
})
</script>

<style scoped>
.page-container { padding: 0; }
.card-header { display: flex; align-items: center; justify-content: space-between; }

.select-all-bar {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #ebeef5;
}
.item-count { margin-left: 16px; color: #909399; font-size: 14px; }

.cart-list { margin: 0; }

.cart-item {
  display: flex;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
  gap: 16px;
}
.cart-item.disabled { opacity: 0.5; }

.item-info { display: flex; align-items: center; flex: 1; min-width: 0; gap: 12px; }
.item-image { flex-shrink: 0; }
.no-image {
  width: 80px; height: 80px;
  display: flex; align-items: center; justify-content: center;
  background: #f5f7fa; border-radius: 4px; color: #c0c4cc;
}
.item-detail { flex: 1; min-width: 0; }
.item-name { font-size: 14px; font-weight: 500; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.item-spec { font-size: 12px; color: #909399; margin-bottom: 4px; }
.item-warn { margin-top: 4px; }

.item-price { width: 100px; text-align: right; flex-shrink: 0; }
.item-price .price { color: #f56c6c; font-weight: 500; }

.item-quantity { width: 120px; flex-shrink: 0; }

.item-subtotal {
  width: 100px; text-align: right; flex-shrink: 0;
  font-size: 16px; font-weight: 600; color: #f56c6c;
}

.item-action { width: 60px; flex-shrink: 0; }

.checkout-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  margin-top: 16px;
  border-top: 2px solid #ebeef5;
}
.checkout-info { display: flex; align-items: center; gap: 24px; }
.total-amount { font-size: 14px; color: #606266; }
.total-amount b { font-size: 20px; color: #f56c6c; }

.checkout-summary { padding: 0 10px; }
.summary-row { display: flex; justify-content: space-between; padding: 8px 0; }
.summary-row.total { border-top: 1px solid #ebeef5; padding-top: 12px; margin-top: 4px; }
.total-price { font-size: 20px; font-weight: 700; color: #f56c6c; }
</style>
