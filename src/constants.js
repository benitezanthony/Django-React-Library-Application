
const localhost = "http://127.0.0.1:8000"

const apiURL = "/api"

export const endpoint = `${localhost}${apiURL}`

export const userIDURL = `${endpoint}/user-id/`
export const countryListURL = `${endpoint}/countries/`
export const ProductListURL = pageNumber => `${endpoint}/products/?page=${pageNumber}`
export const SavedForLaterListURL = `${endpoint}/saved-for-later/`
export const SavedForLaterItemDeleteURL = id => `${endpoint}/saved-for-later-item/${id}/delete/`
export const ProductDetailURL = id => `${endpoint}/products/${id}/`
export const ItemCommentListURL = book_title => `${endpoint}/comments/?book_title=${book_title}`
export const ItemRatingListURL = book_title => `${endpoint}/ratings/?book_title=${book_title}`
export const AuthorListURL = author_name => `${endpoint}/author-list/${author_name}/?author_name=${author_name}`
export const addToCartURL = `${endpoint}/add-to-cart/`
export const orderSummaryURL = `${endpoint}/order-summary/`
export const orderItemDeleteURL = id => `${endpoint}/order-items/${id}/delete/`
export const orderItemUpdateQuantityURL = `${endpoint}/order-item/update-quantity/`
export const checkOutURL = `${endpoint}/checkout/`
export const addCouponURL = `${endpoint}/add-coupon/`
export const addressListURL = addressType => `${endpoint}/addresses/?address_type=${addressType}`
export const addressCreateURL = `${endpoint}/addresses/create/`
export const addToSavedItemListURL = `${endpoint}/add-to-saved-item-list/`
export const addressUpdateURL = id => `${endpoint}/addresses/${id}/update/`
export const addressDeleteURL = id => `${endpoint}/addresses/${id}/delete/`
export const paymentListURL = `${endpoint}/payments/`