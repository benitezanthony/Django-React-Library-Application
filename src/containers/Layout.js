import React, { createRef } from "react";
import {
  Container,
  Divider,
  Grid,
  Header,
  Image,
  List,
  Menu,
  Segment,
  Icon,
  Label,
  Sticky
} from "semantic-ui-react";
import { Link, withRouter } from "react-router-dom";
import { connect } from "react-redux";
import { logout } from "../store/actions/auth";
import { fetchCart } from "../store/actions/cart";

class CustomLayout extends React.Component {

  contextRef = createRef()
  componentDidMount() {
    this.props.fetchCart()
  }

  render() {
    const { authenticated, cart, loading } = this.props

    return (
      <div ref={this.contextRef}>
        <Sticky context={this.contextRef}>
          <Menu inverted>
            <Container>
              <Link to="/">
                <Menu.Item header style={{ fontSize: "1.5em" }}>Home</Menu.Item>
              </Link>
              <Link to="/products">
                <Menu.Item header style={{ fontSize: "1.5em" }}>Products</Menu.Item>
              </Link>
              <Menu.Menu position='right'>
                {authenticated ? (
                  <React.Fragment>
                    <Link to="/profile">
                      <Menu.Item header style={{ fontSize: "1.5em" }} >
                        Profile
                    </Menu.Item>
                    </Link>
                    <Menu.Item
                      loading={loading}
                      onClick={() => this.props.history.push('/order-summary')}>
                      Cart
                    <Icon.Group size='large'>
                        <Icon name='cart' />
                        {/* <Icon corner='top right' name='check' color='green' /> */}
                      </Icon.Group>
                      <Label color='green'>{cart != null ? cart.order_items.length : 0}</Label>
                    </Menu.Item>
                    <Menu.Item header style={{ fontSize: "1.5em" }} onClick={() => this.props.logout()}>
                      Logout
                  </Menu.Item>
                  </React.Fragment>) : (
                    <React.Fragment>
                      <Link to="/login">
                        <Menu.Item header style={{ fontSize: "1.5em" }}>Login</Menu.Item>
                      </Link>
                      <Link to="/signup">
                        <Menu.Item header style={{ fontSize: "1.5em" }}>Signup</Menu.Item>
                      </Link>
                    </React.Fragment>
                  )}
              </Menu.Menu>
            </Container>
          </Menu>
        </Sticky>

        {/* use to fix footer issue, vertical makes it not visible */}
        <Segment style={{ minHeight: 2000 }} vertical>
          {this.props.children}
        </Segment>


        <Segment
          inverted
          vertical
          style={{ margin: "5em 0em 0em", padding: "5em 0em" }} >

          <Container textAlign="center">
            <Grid divided inverted stackable>
              <Grid.Column width={3}>
                <Header inverted as="h4" content="Group 1" />
                <List link inverted>
                  <List.Item as="a">Link One</List.Item>
                  <List.Item as="a">Link Two</List.Item>
                  <List.Item as="a">Link Three</List.Item>
                  <List.Item as="a">Link Four</List.Item>
                </List>
              </Grid.Column>
              <Grid.Column width={3}>
                <Header inverted as="h4" content="Group 2" />
                <List link inverted>
                  <List.Item as="a">Link One</List.Item>
                  <List.Item as="a">Link Two</List.Item>
                  <List.Item as="a">Link Three</List.Item>
                  <List.Item as="a">Link Four</List.Item>
                </List>
              </Grid.Column>
              <Grid.Column width={3}>
                <Header inverted as="h4" content="Group 3" />
                <List link inverted>
                  <List.Item as="a">Link One</List.Item>
                  <List.Item as="a">Link Two</List.Item>
                  <List.Item as="a">Link Three</List.Item>
                  <List.Item as="a">Link Four</List.Item>
                </List>
              </Grid.Column>
              <Grid.Column width={7}>
                <Header inverted as="h4" content="Footer Header" />
                <p>
                  Extra space for a call to action inside the footer that could
                  help re-engage users.
                </p>
              </Grid.Column>
            </Grid>

            <Divider inverted section />
            <Image centered size="mini" src="/logo.png" />
            <List horizontal inverted divided link size="small">
              <List.Item as="a" href="#">
                Site Map
              </List.Item>
              <List.Item as="a" href="#">
                Contact Us
              </List.Item>
              <List.Item as="a" href="#">
                Terms and Conditions
              </List.Item>
              <List.Item as="a" href="#">
                Privacy Policy
              </List.Item>
            </List>
          </Container>
        </Segment>
      </div >
    );
  }
}

const mapStateToProps = state => {
  return {
    authenticated: state.auth.token !== null,
    cart: state.cart.shoppingCart,
    loading: state.cart.loading
  };
};

const mapDispatchToProps = dispatch => {
  return {
    logout: () => dispatch(logout()),
    fetchCart: () => dispatch(fetchCart())
  };
};

export default withRouter(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(CustomLayout)
);
