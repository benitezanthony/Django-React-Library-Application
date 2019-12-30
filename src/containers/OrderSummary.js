import React from 'react'
import {
    Button, Container, Header, Icon, Label, Table, Image, Segment, Message,
    Popup, Card,
} from 'semantic-ui-react'
import { authAxios } from '../utils'
import {
    orderSummaryURL, orderItemDeleteURL, addToCartURL, orderItemUpdateQuantityURL,
    SavedForLaterListURL, addToSavedItemListURL, userIDURL, SavedForLaterItemDeleteURL
} from '../constants'
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { fetchCart } from '../store/actions/cart'


class OrderSummary extends React.Component {

    state = {
        data: null,
        error: null,
        loading: false,
        userID: null

    }

    componentDidMount() {
        this.handleFetchOrder()
        this.props.fetchCart()
        this.handleFetchUserID()
    }

    handleFetchUserID = () => {
        authAxios
            .get(userIDURL)
            .then(res => {
                this.setState({ userID: res.data.userID })
            })
            .catch(err => {
                this.setState({ error: err })
            })
    }

    handleCreateSavedItem = (selectedItem, orderItemID) => {
        const userID = this.state

        authAxios
            .post(addToSavedItemListURL, {
                author_bio: selectedItem.author_bio,
                author_name: selectedItem.author_name,
                description: selectedItem.description,
                discount_price: selectedItem.discount_price,
                genre: selectedItem.genre,
                id: selectedItem.id,
                image: selectedItem.image,
                label: selectedItem.label,
                price: selectedItem.price,
                publisher_info: selectedItem.publisher_info,
                slug: selectedItem.slug,
                title: selectedItem.title,
                user: userID.userID
            })
            .then(res => {
                this.handleRemoveItem(orderItemID)
                this.setState({
                    saving: false,
                    success: true,
                })
                //reload the page to show updated information
                window.location.reload(false)
            })
            .catch(err => {
                this.setState({ error: err })
            })
    }

    handleFetchOrder = () => {
        this.setState({ loading: true })
        authAxios
            .get(orderSummaryURL)
            .then(res => {
                this.setState({ data: res.data, loading: false })
            })
            .catch(err => {
                if (err.response.status === 404) {
                    this.setState({
                        error: "You currently do not have an order",
                        loading: false
                    })
                }
                else {
                    this.setState({ error: err, loading: false })
                }
            })
    }

    handleAddToCart = slug => {
        this.setState({ loading: true })
        authAxios
            .post(addToCartURL, { slug })
            .then(res => {
                console.log(res.data)
                this.handleFetchOrder()
                this.setState({ loading: false })
            })
            .catch(err => {
                this.setState({ error: err, loading: false })
            })
    }


    handleRemoveQuantityFromCart = slug => {
        this.setState({ loading: true })
        authAxios
            .post(orderItemUpdateQuantityURL, { slug })
            .then(res => {
                //callback
                this.handleFetchOrder()
                this.props.fetchCart()
                this.setState({ loading: false })
            })
            .catch(err => {
                this.setState({ error: err })
            })

    }

    handleRemoveItem = itemID => {
        this.setState({ loading: true })
        authAxios.delete(orderItemDeleteURL(itemID))
            .then(res => {
                //callback
                this.handleFetchOrder()
                this.props.fetchCart()
                this.setState({ loading: false })
            })
            .catch(err => {
                this.setState({ error: err })
            })
    }

    render() {
        const { data, error, loading } = this.state
        const { isAuthenticated } = this.props

        if (!isAuthenticated) {
            //return <Redirect to="/login" />;
        }


        return (
            <Container>
                {/*segment padding for better page visibility*/}
                <Segment style={{ padding: "1em 0em" }} vertical>
                    <Header as='h1'>
                        Order Summary
                   </Header>
                </Segment>

                {error && (
                    <Message
                        error
                        header="There was an error"
                        content={JSON.stringify(error)}
                    />
                )}

                <Segment loading={loading}>
                    {data && <Table celled>
                        <Table.Header>
                            <Table.Row>
                                <Table.HeaderCell>Item #</Table.HeaderCell>
                                <Table.HeaderCell>Item name</Table.HeaderCell>
                                <Table.HeaderCell>Item price</Table.HeaderCell>
                                <Table.HeaderCell>Item quantity</Table.HeaderCell>
                                <Table.HeaderCell>Total item price</Table.HeaderCell>
                            </Table.Row>
                        </Table.Header>

                        <Table.Body>
                            {data.order_items.map((orderItem, i) => {

                                return (
                                    <Table.Row key={orderItem.id}>
                                        <Table.Cell>
                                            {i + 1}
                                        </Table.Cell>
                                        <Table.Cell width={7}>
                                            {orderItem.item_obj.title}
                                            <Image size="tiny" src={`http://127.0.0.1:8000${orderItem.item_obj.image}`} />
                                        </Table.Cell>
                                        <Table.Cell>
                                            {orderItem.item_obj.discount_price && <Label color='green' ribbon>DISCOUNT<br />PRICE<br />$ {orderItem.item_obj.discount_price.toFixed(2)}</Label>}<br />
                                            $ {orderItem.item_obj.price.toFixed(2)}
                                        </Table.Cell>
                                        <Table.Cell textAlign='center'>
                                            <Icon name='minus' color='red' style={{ float: 'left', cursor: 'pointer' }} onClick={() => this.handleRemoveQuantityFromCart(orderItem.item_obj.slug)} ></Icon>
                                            {orderItem.quantity}
                                            <Icon name='plus' color='green' style={{ float: 'right', cursor: 'pointer' }} onClick={() => this.handleAddToCart(orderItem.item_obj.slug)}></Icon>
                                            <br></br>
                                            <br></br>
                                            <Popup
                                                content='Saved for later!'
                                                on='click'
                                                hideOnScroll
                                                position='top center'
                                                trigger={
                                                    <Button primary floated='center'
                                                        onClick=
                                                        {
                                                            () => this.handleCreateSavedItem(orderItem.item_obj, orderItem.id)
                                                        }
                                                    >
                                                        Save For Later
                                                    </Button>}
                                            />
                                        </Table.Cell>
                                        <Table.Cell>
                                            $ {orderItem.final_price.toFixed(2)}
                                            <Icon name='trash' color='red' style={{ float: 'right', cursor: 'pointer' }} onClick={() => this.handleRemoveItem(orderItem.id)}></Icon>
                                        </Table.Cell>
                                    </Table.Row>
                                )
                            })}
                            <Table.Row>
                                <Table.Cell />
                                <Table.Cell />
                                <Table.Cell />
                                <Table.Cell colSpan='2' textAlign='center'>
                                    <Label style={{ fontSize: "1.33em" }}>
                                        Order Total: <br></br>
                                        {/* if there's no coupon applied, show regular price*/}
                                        $ {data.coupon == null && (data.total).toFixed(2)}
                                        {/* if there is a coupon applied, also show regular price*/}
                                        {data.coupon && (data.total + data.coupon.amount).toFixed(2)}
                                    </Label>
                                </Table.Cell>
                            </Table.Row>

                        </Table.Body>

                        <Table.Footer>
                            <Table.Row>
                                <Table.HeaderCell colSpan='5' textAlign='right'>
                                    <Link to='/checkout'>
                                        <Button color='yellow'>
                                            Checkout
                                    </Button>
                                    </Link>
                                </Table.HeaderCell>
                            </Table.Row>
                        </Table.Footer>
                    </Table>}
                </Segment>


                <Segment>
                    {/* Saved Item List */}
                    <SavedForLaterItemList />
                </Segment>


            </Container >
        )
    }
}

class SavedForLaterItemList extends React.Component {
    state = {
        loading: false,
        error: null,
        data: [],
        activeIndex: 0,
        itemsPerPage: 10,
        submittedItemsPerPage: 10,
        activePage: 1,
        totalPages: 10,

    }


    handleChange = (e, { name, value }) => this.setState({ [name]: value })

    handleSubmit = () => {
        const { submittedItemsPerPage } = this.state

        this.setState({ itemsPerPage: submittedItemsPerPage })
    }

    handlePaginationChange = (e, { activePage }) => this.setState({ activePage })

    handleClick = (e, titleProps) => {
        const { index } = titleProps
        const { activeIndex } = this.state
        const newIndex = activeIndex === index ? -1 : index

        this.setState({ activeIndex: newIndex })
    }


    componentDidMount() {
        this.handleFetchSavedForLaterList()
    }

    handleFetchSavedForLaterList = () => {
        this.setState({ loading: true })
        // UTILIZE authAxios when authentication is required, not axios
        authAxios.get(SavedForLaterListURL)
            .then(res => {
                this.setState({ data: res.data.results, loading: false })
            })
            .catch(err => {
                this.setState({ error: err, loading: false })
            })
    }

    handleDeleteSavedItem = savedItemID => {
        authAxios
            .delete(SavedForLaterItemDeleteURL(savedItemID))
            .then(res => {
                //reload the page to show updated information
                window.location.reload(false)
                this.handleFetchOrder()
                this.props.fetchCart()
                this.setState({ loading: false })
            })
            .catch(err => {
                this.setState({ error: err })
            })
    }


    handleAddToCart = (slug, savedItemID) => {
        this.setState({ loading: true })
        authAxios
            .post(addToCartURL, { slug })
            .then(res => {
                this.handleDeleteSavedItem(savedItemID)
                this.props.fetchCart()
                this.setState({ loading: false })
            })
            .catch(err => {
                this.setState({ error: err, loading: false })
            })
    }



    render() {
        const { data, error, loading, activeIndex, activePage,
            itemsPerPage, submittedItemsPerPage } = this.state



        return (
            <Container>
                {/*segment padding for better page visibility*/}
                <Segment style={{ padding: "1em 0em" }} vertical>
                    <Header as='h1'>
                        Saved For Later List
                    </Header>
                </Segment>

                {/* 

                {error && (
                    <Message
                        error
                        header='There were some errors with your submission'
                        content={JSON.stringify(error)}
                    />
                )} */}

                <Segment loading={loading}>
                    <Card.Group itemsPerRow={4}>
                        {data.map((item, i) => {
                            return (
                                <React.Fragment>
                                    <Card centered>
                                        <Image
                                            src={`http://127.0.0.1:8000${item.image}`}
                                        />
                                        <Card.Content>
                                            <Card.Header>
                                                {item.title}
                                            </Card.Header>
                                        </Card.Content>
                                        <Popup
                                            content='Item added!'
                                            on='click'
                                            hideOnScroll
                                            position='bottom center'
                                            trigger={
                                                <Button primary floated='right' icon labelPosition='right' onClick={() => this.handleAddToCart(item.slug, item.id)}>
                                                    {/* convert number from string to float, fix to 2 decimal places*/}
                                                    $ {Number.parseFloat(item.price).toFixed(2)}
                                                    <Icon name='plus cart' />
                                                </Button>}
                                        />
                                    </Card>
                                </React.Fragment>
                            )
                        })}
                    </Card.Group>

                </Segment>

            </Container>
        );
    }
}


const mapDispatchToProps = dispatch => {
    return {
        fetchCart: () => dispatch(fetchCart())
    }

}

const mapStateToProps = state => {
    return {
        isAuthenticated: state.auth.token !== null
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(OrderSummary, SavedForLaterItemList);