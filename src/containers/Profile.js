import React from 'react'
import {
    Divider, Header, Grid, Menu, Container, Segment,
    Message, Select, Form, Card, Label, Button, Table, Icon
} from 'semantic-ui-react'
import {
    addressListURL, addressCreateURL, countryListURL,
    userIDURL, addressUpdateURL, addressDeleteURL, paymentListURL
} from '../constants'
import { authAxios } from '../utils'
import { connect } from "react-redux";
import { Redirect } from "react-router-dom";


// property passed to our address form
const UPDATE_FORM = 'UPDATE_FORM'
const CREATE_FORM = 'CREATE_FORM'

class PaymentHistory extends React.Component {

    state = {
        payments: []
    }

    componentDidMount() {
        this.handleFetchPayments()
    }

    handleFetchPayments = () => {
        authAxios
            .get(paymentListURL)
            .then(res => {
                this.setState({
                    payments: res.data.results
                })
            })
            .catch(err => {
                this.setState({ error: err })
            })
    }


    render() {
        const { payments } = this.state

        return (
            <React.Fragment>

                <Table celled>
                    <Table.Header>
                        <Table.Row>
                            <Table.HeaderCell>ID</Table.HeaderCell>
                            <Table.HeaderCell>Amount</Table.HeaderCell>
                            <Table.HeaderCell>Date</Table.HeaderCell>
                        </Table.Row>
                    </Table.Header>

                    <Table.Body>
                        {payments.map(p => {
                            return <Table.Row key={p.id}>
                                <Table.Cell>
                                    {p.id}
                                </Table.Cell>
                                <Table.Cell>
                                    $ {p.amount.toFixed(2)}
                                </Table.Cell>
                                <Table.Cell>
                                    {new Date(p.timestamp).toUTCString()}
                                </Table.Cell>
                            </Table.Row>

                        })}

                    </Table.Body>
                </Table>
            </React.Fragment>
        )
    }
}

class AddressForm extends React.Component {

    state = {
        error: null,
        loading: false,
        formData: {
            address_type: '',
            apartment_address: '',
            country: '',
            default: false,
            id: '',
            street_address: '',
            user: '',
            zip: ''
        },
        saving: false,
        success: false,
    }

    componentDidMount() {
        const { address, formType } = this.props
        if (formType === UPDATE_FORM) {
            this.setState({ formData: address })
        }
    }


    handleSelectChange = (e, { name, value }) => {
        const { formData } = this.state
        const updatedFormData = {
            ...formData,
            [name]: value
        }
        this.setState({
            formData: updatedFormData
        })
    }

    handleToggleDefault = () => {
        const { formData } = this.state
        const updatedFormData = {
            ...formData,
            default: !formData.default
        }
        this.setState({
            formData: updatedFormData
        })
    }

    handleChange = e => {
        const { formData } = this.state
        const updatedFormData = {
            ...formData,
            [e.target.name]: e.target.value
        }
        this.setState({
            formData: updatedFormData
        })
    }

    handleSubmit = e => {
        this.setState({
            saving: true,
        })
        e.preventDefault()
        const { formType } = this.props
        if (formType === UPDATE_FORM) {
            this.handleUpdateAddress()
        }
        else {
            this.handleCreateAddress()
        }

        //used to clear forms after functions above are done
        this.setState({
            formData: {
                address_type: '',
                apartment_address: '',
                country: '',
                default: false,
                id: '',
                street_address: '',
                user: '',
                zip: ''
            }
        })
    }


    handleCreateAddress = () => {
        const { userID, activeItem } = this.props
        const { formData } = this.state
        authAxios
            .post(addressCreateURL, {
                ...formData,
                user: userID,
                address_type: activeItem === 'Billing Info' ? 'B' : 'S'
            })
            .then(res => {
                this.setState({
                    saving: false,
                    success: true,
                    formData: { default: false }
                })
                this.props.callback()

            })
            .catch(err => {
                this.setState({ error: err })
            })
    }

    handleUpdateAddress = () => {
        const { userID, activeItem } = this.props
        const { formData } = this.state
        authAxios
            .put(addressUpdateURL(formData.id), {
                ...formData,
                user: userID,
                address_type: activeItem === 'Billing Info' ? 'B' : 'S'
            })
            .then(res => {
                this.setState({
                    saving: false,
                    success: true,
                    formData: { default: false }
                })
                this.props.callback()
            })
            .catch(err => {
                this.setState({ error: err })
            })
    }

    render() {
        const { error, formData, success, saving } = this.state
        const { countries, formType } = this.props

        return (
            <Form
                onSubmit={this.handleSubmit}
                success={success}
                error={error}>
                <Form.Input name='street_address'
                    required
                    placeholder='Street Address'
                    onChange={this.handleChange}
                    value={formData.street_address}
                />
                <Form.Input name='apartment_address'
                    required
                    placeholder='Apartment Address'
                    onChange={this.handleChange}
                    value={formData.apartment_address}
                />
                <Form.Input name='zip'
                    required
                    placeholder='Zip code'
                    onChange={this.handleChange}
                    value={formData.zip}
                />

                <Form.Field required>
                    {/* country select field */}
                    <Select name='country'
                        loading={countries.length < 1}
                        required
                        clearable
                        search
                        options={countries}
                        placeholder='Country'
                        //method specific to country change
                        onChange={this.handleSelectChange}
                        value={formData.country}
                    />
                </Form.Field>

                <Form.Checkbox name='default'
                    label='Make default address'
                    onChange={this.handleToggleDefault}
                    checked={formData.default}
                />

                {success &&
                    <Message positive>
                        <Message.Header>
                            Your billing information has been updated!
                        </Message.Header>
                    </Message>}

                {formType === UPDATE_FORM ?
                    <Form.Button
                        disabled={saving}
                        loading={saving}
                        primary>Update</Form.Button>
                    :
                    <Form.Button
                        disabled={saving}
                        loading={saving}
                        primary>Save</Form.Button>}

            </Form>
        )
    }
}



class Profile extends React.Component {

    state = {
        activeItem: 'Billing Info',
        addresses: [],
        countries: [],
        userID: null,
        username: null,
        selectedAddress: null
    }

    componentDidMount() {
        this.handleFetchAddresses()
        this.handleFetchCountries()
        this.handleFetchUserID()
    }

    // set success back to false when switching activeItem, resets messages displayed
    handleItemClick = (e, { name }) => {
        //() =>  used to wait for the active Item to update before we fetch the address
        this.setState({
            activeItem: name,
            success: false,
            selectedAddress: null
        }, () => {
            this.handleFetchAddresses()
        })
    }

    handleFormatCountries = countries => {
        const keys = Object.keys(countries)
        // map for each key
        return keys.map(k => {
            return {
                key: k,
                //what the user actually sees, the country name
                text: countries[k],
                //the country code k, the value we want to use when submitting data
                value: k
            }
        })
    }

    handleDeleteAddress = addressID => {
        authAxios
            .delete(addressDeleteURL(addressID))
            .then(res => {
                this.handleCallBack()
            })
            .catch(err => {
                this.setState({ error: err })
            })
    }

    handleSelectAddress = address => {
        this.setState({ selectedAddress: address })
    }

    handleFetchUserID = () => {
        authAxios
            .get(userIDURL)
            .then(res => {
                this.setState({
                    userID: res.data.userID,
                    username: res.data.username
                })
            })
            .catch(err => {
                this.setState({ error: err })
            })
    }

    handleFetchCountries = () => {
        authAxios
            .get(countryListURL)
            .then(res => {
                this.setState({ countries: this.handleFormatCountries(res.data) })
            })
            .catch(err => {
                this.setState({ error: err })
            })
    }

    handleFetchAddresses = () => {
        this.setState({ loading: true })
        // used to figure out if shipping or billing address
        const { activeItem } = this.state
        authAxios
            // if billing info requested, get billing address, otherwise, shipping address
            .get(addressListURL(activeItem === 'Billing Info' ? 'B' : 'S'))
            .then(res => {
                this.setState({ addresses: res.data.results, loading: false })
            })
            .catch(err => {
                this.setState({ error: err })
            })
    }

    // used to update and show values in the page when we submit an update
    handleCallBack = () => {
        this.handleFetchAddresses()
        this.setState({ selectedAddress: null })
    }


    render() {
        const { activeItem, error, loading, addresses,
            countries, selectedAddress, userID, username } = this.state

        const { isAuthenticated } = this.props
        if (!isAuthenticated) {
            return <Redirect to="/login" />
        }

        return (
            <Container>
                {/*segment padding for better page visibility*/}
                <Segment style={{ padding: "1em 0em" }} vertical>
                    <Header as='h1'>
                        User Information: {username}
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

                    <Grid container columns={2} divided>
                        <Grid.Row>
                            <Grid.Column width={6}>
                                <Menu pointing vertical fluid>
                                    <Menu.Item
                                        name='User Credentials'
                                        active={activeItem === 'User Credentials'}
                                        onClick={this.handleItemClick}
                                    />
                                    <Menu.Item
                                        name='Personal Info'
                                        active={activeItem === 'Personal Info'}
                                        onClick={this.handleItemClick}
                                    />
                                    <Menu.Item
                                        name='Billing Info'
                                        active={activeItem === 'Billing Info'}
                                        onClick={this.handleItemClick}
                                    />
                                    <Menu.Item
                                        name='Shipping Info'
                                        active={activeItem === 'Shipping Info'}
                                        onClick={this.handleItemClick}
                                    />
                                    <Menu.Item
                                        name='Payment History'
                                        active={activeItem === 'Payment History'}
                                        onClick={this.handleItemClick} />
                                </Menu>
                            </Grid.Column>

                            <Grid.Column width={10}>
                                <Header>{`View your ${activeItem}`}</Header>

                                <Divider />
                                {/* display currently stored information here*/}

                                {/* stored billing/shipping information */}
                                {(activeItem === 'Billing Info' && addresses.length > 0) ||
                                    (activeItem === 'Shipping Info' && addresses.length > 0) ?

                                    addresses.map(a => {

                                        return (
                                            < React.Fragment >
                                                <Card.Group key={a.id}>
                                                    <Card>
                                                        <Card.Content>
                                                            <Card.Header>
                                                                {a.street_address}, {a.apartment_address}
                                                                {/* if default, add label */}
                                                                {a.default && <Label floating color='blue'>
                                                                    Default
                                                                </Label>}
                                                            </Card.Header>
                                                            <Card.Meta>
                                                                {a.zip},
                                                                {/*                               
                                                                With this notation, you’ll never run into Cannot read property ‘.text’ of undefined. You basically check if object exists, 
                                                                if not, you create an empty object on the fly. This way, the next level key will always be accessed from an object that 
                                                                exists or an empty object, but never from undefined. */}

                                                                {/* find the country name using the country code, a.country is the country code, .text will give the country text name */}
                                                                {(countries.find(object => object.key === a.country) || {}).text} ({a.country})
                                                            </Card.Meta>
                                                        </Card.Content>
                                                        <Card.Content extra>
                                                            <Button
                                                                color='basic green'
                                                                onClick={() => this.handleSelectAddress(a)}>
                                                                Update
                                                                </Button>
                                                            <Button
                                                                color='basic red'
                                                                onClick={() => this.handleDeleteAddress(a.id)}>
                                                                Delete
                                                                </Button>
                                                        </Card.Content>
                                                    </Card>
                                                </Card.Group>


                                                {/* if we have a selected address and are updating, show this form */}
                                                {
                                                    selectedAddress === a &&
                                                    <React.Fragment>
                                                        <Divider />
                                                        <Header>Update the address above</Header>
                                                        < AddressForm
                                                            activeItem={activeItem}
                                                            countries={countries}
                                                            address={selectedAddress}
                                                            formType={UPDATE_FORM}
                                                            userID={userID}
                                                            callback={this.handleCallBack} />
                                                    </React.Fragment>
                                                }

                                            </React.Fragment>
                                        )
                                    })
                                    : activeItem === 'Billing Info' || activeItem === 'Shipping Info' ?
                                        <Card fluid>
                                            <Card.Content>
                                                <Card.Header>
                                                    No address saved
                                                </Card.Header>
                                            </Card.Content>
                                        </Card> : null
                                }


                                {/* input forms */}
                                {
                                    activeItem === 'User Credentials' ?
                                        <Form>
                                            <Form.Input name='username'
                                                required
                                                placeholder='Username'
                                                onChange={this.handleChange} />
                                            <Form.Input name='password'
                                                required
                                                placeholder='Password'
                                                onChange={this.handleChange} />
                                        </Form>
                                        :
                                        activeItem === 'Personal Info' ?
                                            <Form>
                                                <Form.Input name='name'
                                                    required
                                                    placeholder='First and Last Name'
                                                    onChange={this.handleChange} />
                                                <Form.Input name='nickname'
                                                    required
                                                    placeholder='Nickname'
                                                    onChange={this.handleChange} />
                                                <Form.Input name='email'
                                                    required
                                                    placeholder='Email Address'
                                                    onChange={this.handleChange} />
                                                <Form.Input name='home_address'
                                                    required
                                                    placeholder='Home Address'
                                                    onChange={this.handleChange} />
                                            </Form>
                                            :
                                            activeItem === 'Billing Info' ?
                                                (
                                                    <React.Fragment>
                                                        <Header>Create a new address</Header>
                                                        <AddressForm
                                                            activeItem={activeItem}
                                                            countries={countries}
                                                            formType={CREATE_FORM}
                                                            userID={userID}
                                                            callback={this.handleCallBack} />
                                                    </React.Fragment>
                                                )
                                                :
                                                activeItem === 'Shipping Info' ?
                                                    (
                                                        <React.Fragment>
                                                            <Header>Create a new address</Header>
                                                            <AddressForm
                                                                activeItem={activeItem}
                                                                countries={countries}
                                                                formType={CREATE_FORM}
                                                                userID={userID}
                                                                callback={this.handleCallBack} />
                                                        </React.Fragment>
                                                    )
                                                    :
                                                    activeItem === 'Payment History' ?
                                                        (
                                                            <PaymentHistory />
                                                        )
                                                        : null
                                }
                            </Grid.Column>
                        </Grid.Row>
                    </Grid>
                </Segment>
            </Container >
        )
    }
}

const mapStateToProps = state => {
    return {
        isAuthenticated: state.auth.token !== null
    }
}

export default connect(mapStateToProps)(Profile)
