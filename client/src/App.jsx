import React from "react";
import { DrizzleContext } from "drizzle-react";
import BiletoApp from "./BiletoApp";

export default () => (
    <DrizzleContext.Consumer>
        {(drizzleContext) => {
            const { drizzle, drizzleState, initialized } = drizzleContext;

            if (!initialized) {
                return "Loading...";
            }

            return <BiletoApp drizzle={drizzle} drizzleState={drizzleState} />;
        }}
    </DrizzleContext.Consumer>
);
