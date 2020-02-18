import React from 'react'
import axios from 'axios'
import { connect } from 'react-redux'
import {
    Button, Container, Icon, Item, Label, Message, Segment, Header, Pagination,
    Grid, Divider, Popup, Form, Card, Modal, Image, Rating, Dropdown, Menu
} from 'semantic-ui-react'
import { ProductListURL, addToCartURL, BrowseAndSortURL, genreChoiceListURL } from '../constants'
import { authAxios } from '../utils'
import { fetchCart } from '../store/actions/cart'


class ProductList extends React.Component {
    state = {
        loading: false,
        error: null,
        data: [], //note, value stored from response is res.data.results
        submittedItemsPerPage: 10,
        activePage: 1,
        totalPages: 1,
        defaultActivePage: 1,  //default activate page is #1
        itemsPerPage: 1,
        itemTotalCount: 1,
        sortBy: null,
        browseBy: null,
        activeSortItem: null,
        activeBrowseItem: null,
        genreChoiceList: null,
    }


    handleBrowseClick = (e, { name }) => {
        this.setState({
            activeBrowseItem: name
        })
    }

    handleSortClick = (e, { name }) => {
        const sortChoice = name
        const { browseBy } = this.state
        this.setState({
            activeSortItem: name,
            sortBy: sortChoice
        })
        this.handleFetchBrowseAndSortByList(browseBy, sortChoice)
    }

    handleChange = (e, { value }) => {
        this.setState({ browseBy: value })
        const { sortBy, defaultActivePage } = this.state
        /* if genre selection is cleared, selection is an empty string and we browse
        by handleFetchProductList(), the default browsing method */
        if (value.trim() == "") {
            this.handleFetchProductList(defaultActivePage)
            /* if dropdown menu cleared, reset browse and sort back to null */
            this.setState({
                browseBy: null,
                sortBy: null,
                activeBrowseItem: null,
                activeSortItem: null,
            })
        }
        else {
            this.handleFetchBrowseAndSortByList(value, sortBy)
        }

    }


    handleTotalPageCount = (totalProductsCount, itemsPerPage) => {
        //if item count divided by items per page has NO remainder



        if (totalProductsCount % itemsPerPage === 0) {

            const newPageCount = totalProductsCount / itemsPerPage
            this.setState({ totalPages: newPageCount })

        }
        //else, if item count divided by items per page has remainder, add 1
        else {
            const newPageCount = Math.floor(totalProductsCount / itemsPerPage) + 1
            this.setState({ totalPages: newPageCount })

        }
    }

    handlePaginationChange = (e, { activePage }) => {
        this.setState({ activePage })
        this.handleFetchProductList(activePage)
    }


    componentDidMount() {
        const { defaultActivePage } = this.state
        this.handleFetchProductList(defaultActivePage)
        this.hadleFetchItemsPerPage()
        this.hadleFetchItemTotalCount()
        this.handleFetchGenreChoices()
    }

    hadleFetchItemsPerPage = () => {
        this.setState({ loading: true })
        axios.get(ProductListURL(1))
            .then(res => {
                this.setState({ itemsPerPage: res.data.results.length, loading: false })
            })
            .catch(err => {
                this.setState({ error: err, loading: false })
            })
    }

    hadleFetchItemTotalCount = () => {
        this.setState({ loading: true })
        axios.get(ProductListURL(1))
            .then(res => {
                this.setState({ itemTotalCount: res.data.count, loading: false })
            })
            .catch(err => {
                this.setState({ error: err, loading: false })
            })
    }

    handleFetchProductList = pageNumber => {
        this.setState({ loading: true })
        const { itemsPerPage } = this.state

        axios.get(ProductListURL(pageNumber))
            .then(res => {
                this.handleTotalPageCount(res.data.count, itemsPerPage)
                this.setState({ data: res.data.results, loading: false })

            })
            .catch(err => {
                this.setState({ error: err, loading: false })
            })
    }

    handleFetchBrowseAndSortByList = (browseBy, sortBy) => {
        this.setState({ loading: true })
        axios
            .get(BrowseAndSortURL(browseBy, sortBy))
            .then(res => {
                /* console.log(res) */
                this.setState({ data: res.data.results, loading: false })
            })
            .catch(err => {
                this.setState({ error: err })
            })
    }

    handleFetchGenreChoices = () => {
        axios
            .get(genreChoiceListURL)
            .then(res => {
                this.setState({
                    genreChoiceList: this.handleFormatGenreChoices(res.data)
                })
            })
            .catch(err => {
                this.setState({ error: err })
            })
    }

    handleFormatGenreChoices = genreChoiceList => {
        /* convert array of arrays to Javascript object */
        var obj = {}
        genreChoiceList.forEach(function (genreChoiceList) {
            obj[genreChoiceList[0]] = genreChoiceList[1]
        })

        const keys = Object.keys(obj)
        // map for each key
        return keys.map(k => {
            return {
                key: k,
                //what the user actually sees, the genre name
                text: obj[k],
                //the genre code k, the value we want to use when submitting data
                value: k
            }
        })

    }

    handleAddToCart = slug => {
        this.setState({ loading: true })
        authAxios
            .post(addToCartURL, { slug })
            .then(res => {
                this.props.fetchCart()
                this.setState({ loading: false })
            })
            .catch(err => {
                this.setState({ error: err, loading: false })
            })
    }


    render() {
        const { data, error, loading, activePage,
            itemsPerPage, submittedItemsPerPage, genreChoiceList,
            totalPages, browseBy, sortBy, activeSortItem, activeBrowseItem } = this.state

        return (
            <Container>
                {/*segment padding for better page visibility*/}
                <Segment style={{ padding: "1em 0em" }} vertical>
                    <Header as='h1'>
                        Product List
                    </Header>
                </Segment>


                {error && (
                    <Message
                        error
                        header='There were some errors with your submission'
                        content={JSON.stringify(error)}
                    />
                )}

                {/* browse and sort menus */}
                <Menu text>
                    <Menu.Item header>Browse By</Menu.Item>
                    <Menu.Item
                        name='genre'
                        active={activeBrowseItem === 'genre'}
                    />
                    <Dropdown
                        placeholder='Select Genre'
                        clearable
                        search
                        name="genre"
                        active={activeBrowseItem === 'genre'}
                        onChange={this.handleChange}
                        onClick={this.handleBrowseClick}
                        selection
                        options={genreChoiceList}
                        value={browseBy}
                    />
                    <Menu.Item
                        name='topSellers'
                        active={activeBrowseItem === 'topSellers'}
                        onClick={this.handleBrowseClick}
                    />
                    <Menu.Item
                        name='bookRating'
                        active={activeBrowseItem === 'bookRating'}
                        onClick={this.handleBrowseClick}
                    />
                </Menu>
                <Menu text>
                    <Menu.Item header>Sort By</Menu.Item>
                    <Menu.Item
                        name='title'
                        active={activeSortItem === 'title'}
                        onClick={this.handleSortClick}
                    />
                    <Menu.Item
                        name='author_name'
                        active={activeSortItem === 'author_name'}
                        onClick={this.handleSortClick}
                    />
                    <Menu.Item
                        name='price'
                        active={activeSortItem === 'price'}
                        onClick={this.handleSortClick}
                    />
                    <Menu.Item
                        name='rating'
                        active={activeSortItem === 'rating'}
                        onClick={this.handleSortClick}
                    />
                    <Menu.Item
                        name='release_date'
                        active={activeSortItem === 'release_date'}
                        onClick={this.handleSortClick}
                    />
                </Menu>





                <Segment loading={loading}>
                    <Card.Group itemsPerRow={3}>
                        {data.map((item, i) => {

                            return (
                                < React.Fragment >
                                    <Card centered>

                                        <Image
                                            centered size='medium'
                                            src={item.image}
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => this.props.history.push(`/products/${item.id}`)}
                                        />

                                        <Label attached='top right' color={item.label === 'Fiction' ? "blue" : "red"} >
                                            {item.label}
                                        </Label>
                                        <Card.Content>
                                            <Card.Header
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => this.props.history.push(`/products/${item.id}`)}>
                                                {item.title}
                                            </Card.Header>
                                            <Card.Meta>
                                                <span className='cinema'>{item.genre}</span>
                                            </Card.Meta>
                                            <Card.Description>
                                                Written by {item.author_name}
                                                <br></br><br></br>
                                                Date Released:<br></br>
                                                {new Date(item.release_date).toUTCString()}
                                            </Card.Description>
                                        </Card.Content>
                                        <Card.Content extra>
                                            <a>
                                                <Rating icon='star'
                                                    rating={item.avg_rating.rating__avg}
                                                    maxRating={10}
                                                    disabled />

                                                {/* With this notation, you’ll never run into Cannot read property ‘.rating__avg’ or '.avg_rating' of undefined. 
                                                    You basically check if object exists, if not, you create an empty object on the fly. This way, the next level key 
                                                    will always be accessed from an object that exists or an empty object, but never from undefined. */}

                                                {/* Show ratings if not null or NaN */}
                                                {((item || {}).avg_rating || {}).rating__avg && <Label color='white'>
                                                    {Number.parseFloat(((item || {}).avg_rating || {}).rating__avg).toFixed(2)}
                                                </Label>}
                                                <br></br>Customer Reviews
                                            </a>
                                        </Card.Content>
                                        <Popup
                                            content='Item added!'
                                            on='click'
                                            hideOnScroll
                                            position='bottom center'
                                            trigger={
                                                <Button primary floated='right' icon labelPosition='right' onClick={() => this.handleAddToCart(item.slug)}>
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

                <Pagination
                    activePage={activePage}
                    onPageChange={this.handlePaginationChange}
                    totalPages={totalPages}
                />

                <Segment compact>
                    <Form onSubmit={this.handleSubmit}>
                        <Form.Input
                            label='Items per page'
                            name='submittedItemsPerPage'
                            onChange={this.handleChange}
                            value={submittedItemsPerPage}
                        />
                        <Form.Button content='Submit' />
                    </Form>
                </Segment>

            </Container >
        );
    }
}

const mapDispatchToProps = dispatch => {
    return {
        fetchCart: () => dispatch(fetchCart())
    }

}

export default connect(null, mapDispatchToProps)(ProductList)