import {Ionicons} from '@expo/vector-icons';
import {createStackNavigator} from '@react-navigation/stack';
import moment from 'moment-timezone';
import React, {useState} from 'react';
import {
	Alert,
	FlatList,
	RefreshControl,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import {Button, Card} from 'react-native-elements';
import {usePaginatedQuery} from 'react-query';

import {setCartAction} from '../actions/cart';
import CardItemRow from '../components/CardItemRow';
import ErrorDisplay from '../components/ErrorDisplay';
import NoSiteSelected from '../components/NoSiteSelected';
import Pagination from '../components/Pagination';
import ToggleDrawerButton from '../components/ToggleDrawerButton';
import NoAccountSelected from '../components/commerce/NoAccountSelected';
import Order from '../components/commerce/Order';
import {useAppState} from '../hooks/appState';
import useScrollToTop from '../hooks/useScrollToTop';
import styles from '../styles/main';
import {colors} from '../styles/values';

const Cart = ({navigation}) => {
	const [state, dispatch, request] = useAppState();

	function newCart() {
		request(
			`/o/headless-commerce-delivery-cart/v1.0/channels/${channelId}/carts`,
			{
				data: {
					accountId,
					billingAddressId: 0,
					currencyCode: 'USD',
					shippingAddressId: 0,
				},
				method: 'POST',
			}
		).then(() => {
			refetch();
		});
	}

	function deleteCart(id) {
		Alert.alert(
			'Confirm:',
			'Are you sure you want to delete your cart?',
			[
				{
					style: 'cancel',
					text: 'Cancel',
				},
				{
					onPress: () => {
						request(
							`/o/headless-commerce-admin-order/v1.0/orders/${id}`,
							{method: 'DELETE'}
						).then(() => {
							refetch();
						});
					},
					text: 'Yes, Delete It',
				},
			],
			{cancelable: false}
		);
	}

	const {accountId, cartId, channelId, siteId} = state;

	const [page, setPage] = useState(1);

	const {error, refetch, resolvedData, status} = usePaginatedQuery(
		['carts', accountId, channelId, page],
		() => {
			return request(
				`/o/headless-commerce-admin-order/v1.0/orders?page=${page}&filter=accountId eq ${accountId} and channelId eq ${channelId} and orderStatus eq 2`
			);
		}
	);

	const flatList = useScrollToTop(resolvedData ? resolvedData.page : null);

	const items = resolvedData ? resolvedData.items : [];

	const renderItem = ({index, item}) => {
		const selectedCart = cartId === item.id;

		return (
			<TouchableOpacity
				onPress={() => {
					navigation.navigate('Cart', {
						...item,
					});
				}}
			>
				<Card
					containerStyle={[
						index === items.length - 1 ? styles.mb2 : null,
						selectedCart ? cartStyles.selected : {},
						styles.m2,
						styles.pRelative,
					]}
					title={`Cart ${item.id}`}
				>
					<Button
						containerStyle={[
							styles.pAbsolute,
							{right: 0, top: -12},
						]}
						icon={
							<Ionicons color="#000" name="ios-close" size={32} />
						}
						onPress={() => deleteCart(item.id)}
						type="clear"
					/>

					<View>
						<CardItemRow
							label="Modified"
							value={moment(item.modifiedDate).fromNow()}
						/>
						<CardItemRow
							label="Total"
							value={item.totalFormatted}
						/>
					</View>

					<Button
						disabled={selectedCart}
						onPress={() => dispatch(setCartAction(item.id))}
						style={styles.mt2}
						title={selectedCart ? 'Selected Cart' : 'Select Cart'}
					/>
				</Card>
			</TouchableOpacity>
		);
	};

	if (!channelId || !siteId) {
		return <NoSiteSelected />;
	}

	if (!accountId) {
		return <NoAccountSelected />;
	}

	return (
		<View style={{flex: 1}}>
			{items && (
				<FlatList
					ListHeaderComponent={
						<>
							{status === 'error' && (
								<ErrorDisplay
									error={error.message}
									onRetry={() => refetch()}
								/>
							)}

							{items &&
								items.length === 0 &&
								status === 'success' && (
									<Text
										style={[styles.m2, styles.textCenter]}
									>
										There are no carts to display.
									</Text>
								)}

							<Button
								onPress={() => newCart()}
								style={[styles.mx2, styles.mt2]}
								title="New Cart"
							/>
						</>
					}
					data={items}
					keyExtractor={({id}) => id.toString()}
					ref={flatList}
					refreshControl={
						<RefreshControl
							onRefresh={() => refetch()}
							refreshing={status === 'loading'}
						/>
					}
					renderItem={(obj) => renderItem(obj)}
				/>
			)}

			{resolvedData && (
				<Pagination
					lastPage={resolvedData.lastPage}
					page={resolvedData.page}
					pageSize={resolvedData.pageSize}
					setPage={setPage}
					totalCount={resolvedData.totalCount}
				/>
			)}
		</View>
	);
};

const cartStyles = StyleSheet.create({
	selected: {
		borderColor: colors.primary,
	},
});

function ViewCart({route}) {
	return <Order {...route.params} />;
}

const Stack = createStackNavigator();

function CartNavigation({navigation}) {
	return (
		<Stack.Navigator
			initialRouteName="Carts"
			screenOptions={{
				headerRight: () => (
					<ToggleDrawerButton navigation={navigation} />
				),
			}}
		>
			<Stack.Screen
				component={Cart}
				name="Carts"
				options={{title: 'Cart'}}
			/>
			<Stack.Screen
				component={ViewCart}
				name="Cart"
				options={({route}) => {
					return {title: `Cart ${route.params.id}`};
				}}
			/>
		</Stack.Navigator>
	);
}

export default CartNavigation;
