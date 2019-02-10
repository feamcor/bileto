import React from "react";
import logo from "./tickets.svg";

const NavBar = (props) => {
    return (
        <nav className="navbar sticky-top navbar-dark text-white bg-dark">
            <img
                className="navbar-brand d-inline-block align-middle"
                src={logo}
                width="64px"
                height="64px"
                alt="bileto-logo"
            />
            <h4 className="nav-text">
                <strong>BILETO</strong> a decentralized ticket store for Ethereum
            </h4>
            <ul className="navbar-nav">
                <li className="nav-item">
                    <a
                        href={`https://etherscan.io/address/${props.address}`}
                        className="nav-link"
                        rel="noopener noreferrer"
                        target="_blank"
                    >
                        {props.address}
                    </a>
                </li>
            </ul>
        </nav>
    );
};

export default NavBar;
