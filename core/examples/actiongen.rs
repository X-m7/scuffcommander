use scuffcommander_core::plugins::obs::{OBSAction, OBSQuery};
use scuffcommander_core::plugins::vts::{VTSAction, VTSQuery};
use scuffcommander_core::plugins::{PluginAction, PluginQuery};
use scuffcommander_core::{Action, ActionConfig, Condition};
use std::collections::HashMap;

// Nested conditionals
// if scene == "Desktop + VTS" {
//      scene = "Waiting"
// } else {
//      if scene == "Waiting" {
//          scene = "Desktop + VTS"
//      }
// }
fn obs_toggle(actions: &mut ActionConfig) {
    // scene == "Desktop + VTS"
    let query1 = Condition {
        query: PluginQuery::OBS(OBSQuery::CurrentProgramScene),
        target: "Desktop + VTS".to_string(),
    };
    // scene == "Waiting"
    let query2 = Condition {
        query: PluginQuery::OBS(OBSQuery::CurrentProgramScene),
        target: "Waiting".to_string(),
    };
    // scene = "Waiting"
    let then1 = Action::Single(PluginAction::OBS(OBSAction::ProgramSceneChange(
        "Waiting".to_string(),
    )));
    // scene = "Desktop + VTS"
    let then2 = Action::Single(PluginAction::OBS(OBSAction::ProgramSceneChange(
        "Desktop + VTS".to_string(),
    )));
    // if scene == "Waiting" { scene = "Desktop + VTS" }
    let else1 = Action::If(query2, Box::new(then2), None);

    actions.actions.insert(
        "Scene Toggle".to_string(),
        Action::If(query1, Box::new(then1), Some(Box::new(else1))),
    );
}

// VTS only accepts model change by id, visible in the vtube.json file of the model
// Here Akari => d87b771d2902473bbaa0226d03ef4754 and Chloe => ca883c1edcac4739904f17ac2e92c768
// if model == "Akari" {
//      model = "Chloe"
// } else {
//      if model == "Chloe" {
//          model = "Akari"
//      }
// }
fn vts_toggle_model(actions: &mut ActionConfig) {
    // model == "Akari"
    let query1 = Condition {
        query: PluginQuery::VTS(VTSQuery::ActiveModelId),
        target: "d87b771d2902473bbaa0226d03ef4754".to_string(),
    };
    // model == "Chloe"
    let query2 = Condition {
        query: PluginQuery::VTS(VTSQuery::ActiveModelId),
        target: "ca883c1edcac4739904f17ac2e92c768".to_string(),
    };
    // model = "Chloe"
    let then1 = Action::Single(PluginAction::VTS(VTSAction::LoadModel(
        "ca883c1edcac4739904f17ac2e92c768".to_string(),
    )));
    // model = "Akari"
    let then2 = Action::Single(PluginAction::VTS(VTSAction::LoadModel(
        "d87b771d2902473bbaa0226d03ef4754".to_string(),
    )));
    // if model == "Chloe" { model = "Akari" }
    let else1 = Action::If(query2, Box::new(then2), None);

    actions.actions.insert(
        "Model Toggle".to_string(),
        Action::If(query1, Box::new(then1), Some(Box::new(else1))),
    );
}

// Independent conditionals
// if current_model == "Akari" {
//      toggle_expr("EyesLove.exp3.json")
// }
// if current_model == "Chloe" {
//      toggle_expr("expressionb.exp3.json")
// }
fn vts_model_dependent_expression_toggle(actions: &mut ActionConfig) {
    // current_model == "Akari"
    let query1 = Condition {
        query: PluginQuery::VTS(VTSQuery::ActiveModelId),
        target: "d87b771d2902473bbaa0226d03ef4754".to_string(),
    };
    // current_model == "Chloe"
    let query2 = Condition {
        query: PluginQuery::VTS(VTSQuery::ActiveModelId),
        target: "ca883c1edcac4739904f17ac2e92c768".to_string(),
    };
    // toggle_expr("EyesLove.exp3.json")
    let then1 = Action::Single(PluginAction::VTS(VTSAction::ToggleExpression(
        "EyesLove.exp3.json".to_string(),
    )));
    // toggle_expr("expressionb.exp3.json")
    let then2 = Action::Single(PluginAction::VTS(VTSAction::ToggleExpression(
        "expressionb.exp3.json".to_string(),
    )));

    let chain = vec![
        Action::If(query1, Box::new(then1), None),
        Action::If(query2, Box::new(then2), None),
    ];

    actions
        .actions
        .insert("Model Dep Expr Toggle".to_string(), Action::Chain(chain));
}

fn main() {
    let mut actions = ActionConfig {
        actions: HashMap::new(),
    };

    // Single action per button
    actions.actions.insert(
        "Waiting Scene".to_string(),
        Action::Single(PluginAction::OBS(OBSAction::ProgramSceneChange(
            "Waiting".to_string(),
        ))),
    );
    actions.actions.insert(
        "Desktop+VTS Scene".to_string(),
        Action::Single(PluginAction::OBS(OBSAction::ProgramSceneChange(
            "Desktop + VTS".to_string(),
        ))),
    );
    actions.actions.insert(
        "Qt Expr Toggle".to_string(),
        Action::Single(PluginAction::VTS(VTSAction::ToggleExpression(
            "Qt.exp3.json".to_string(),
        ))),
    );
    actions.actions.insert(
        "expressiong Toggle".to_string(),
        Action::Single(PluginAction::VTS(VTSAction::ToggleExpression(
            "expressiong.exp3.json".to_string(),
        ))),
    );

    // Multiple actions per button
    let chain = vec![
        Action::Single(PluginAction::VTS(VTSAction::ToggleExpression(
            "Qt.exp3.json".to_string(),
        ))),
        Action::Single(PluginAction::VTS(VTSAction::ToggleExpression(
            "expressiong.exp3.json".to_string(),
        ))),
    ];
    actions
        .actions
        .insert("Dual Expr Toggle".to_string(), Action::Chain(chain));

    obs_toggle(&mut actions);
    vts_model_dependent_expression_toggle(&mut actions);
    vts_toggle_model(&mut actions);

    println!("{}", serde_json::to_string_pretty(&actions).unwrap());
}
